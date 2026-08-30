interface BatchRecordEvent {
    start: [receiver: VoiceReceiver];
    stop: [receiver: VoiceReceiver];
    clear: []
}
type UserRecordOptions = { userId: string, receiver: VoiceReceiver };

import { type WriteStream, createWriteStream, renameSync } from 'fs';
import moment from 'moment-timezone';
import path from 'path';
import config from '../config';
import logger from './logger';
import type { AudioReceiveStream, VoiceReceiver } from '@discordjs/voice';
import { OpusEncoder } from '@discordjs/opus';
import { EventEmitter } from'events';
import { fileArchive } from './functions';

const { audioOutputPath, outputTimeFormat, timeZone, sampleRate, channelCount } = config.settings;
const chunkPerMs = (sampleRate * 2 * channelCount) / 1000; // Size of 16-bit PCM file in 1 ms
const batchRecord = new EventEmitter<BatchRecordEvent>().setMaxListeners(3);
const recordings = new Map<string, UserRecord>();

export const startChannelRecord = (receiver: VoiceReceiver) => batchRecord.emit('start', receiver);
export const stopAllRecording = (receiver: VoiceReceiver) => batchRecord.emit('stop', receiver);
export const clearAllRecording = () => batchRecord.emit('clear');
export const addUserRecording = (userId: string, receiver: VoiceReceiver) => recordings.set(userId, new UserRecord({ userId, receiver }));
export const getUserRecording = (userId: string) => recordings.get(userId);
export const hasRecordings = () => recordings.size !== 0;
export const mappedRecordings = <Type>(mapFunc: (v: UserRecord, k: number) => Type) => Array.from(recordings.values(), mapFunc);

export class UserRecord {
    public readonly userId: string;
    public readonly beginTime: number;
    public readonly encoder: OpusEncoder;
    private _lastSilence?: number;
    public readonly listenStream: AudioReceiveStream;
    public readonly writeStream: WriteStream;
    private _isSpeaking?: boolean;
    public readonly tempRecordingFilePath: string;
    public readonly receiver: VoiceReceiver;

    private _startSpeaking = (userId: string) => {
        if (userId !== this.userId) return;
        const { listenStream, _writeSilenceData, _lastSilence, beginTime } = this;
        listenStream.removeAllListeners('data');
        const silenceTime = Date.now() - (_lastSilence ?? beginTime);
        _writeSilenceData(silenceTime);
        listenStream.on('data', this._writeRecordData);
        this._isSpeaking = true;
    }

    private _stopSpeaking = (userId: string) => {
        if (userId !== this.userId) return;
        this._lastSilence = Date.now();
        this.listenStream.removeAllListeners('data');
        this._isSpeaking = false;
    }

    private _writeRecordData = (chunk: Buffer) => this.writeStream.write(this.encoder.decode(chunk));

    private _writeSilenceData = (durationInMs: number) => this.writeStream.write(Buffer.alloc(durationInMs * chunkPerMs));

    constructor ({ userId, receiver }: UserRecordOptions) {
        const listenStream = receiver.subscribe(userId);
        const filePath = path.join(audioOutputPath, `${moment().tz(timeZone).format(outputTimeFormat)}-${userId}.pcm`);
        const writeStream = createWriteStream(filePath);
        const encoder = new OpusEncoder(sampleRate, channelCount);
        const speakingMap = receiver.speaking;

        const beginTime = Date.now();
        this.userId = userId;
        this.beginTime = beginTime;
        this.receiver = receiver;
        this.encoder = encoder;
        this.listenStream = listenStream;
        this.writeStream = writeStream;
        this.tempRecordingFilePath = filePath;

        if(speakingMap.users.has(userId)) listenStream.on('data', this._writeRecordData);
        if(!speakingMap.listenerCount('start')) speakingMap.on('start', this._startSpeaking);
        if(!speakingMap.listenerCount('end')) speakingMap.on('end', this._stopSpeaking);

        logger.log(`已开始对用户ID为${userId}的录音`);

        return this;
    }

    public get lastSilence() {
        return this._lastSilence;
    }

    public get isSpeaking() {
        return this._isSpeaking;
    }

    public get isPausing() {
        return this.listenStream.isPaused();
    }

    public get size() {
        return this.writeStream.bytesWritten;
    }

    /**
     * Pause recording a user. Make sure that the user has not paused or an error will be thrown.
     * @returns {this}
     */
    public pauseRecord(): this {
        if(this.listenStream.isPaused()) throw new Error('录音早已暂停');
        this.listenStream.pause();
        this._lastSilence = Math.min(Date.now(), this._lastSilence ?? Number.MAX_SAFE_INTEGER);
        logger.log(`RECORD 已暂停对用户ID为${this.userId}的录音`);
        return this;
    }

    /**
     * Resume recording a user. Make sure that the user has already paused or an error will be thrown.
     * @returns {this}
     */
    public resumeRecord (): this {
        if (!this.listenStream.isPaused()) throw new Error('录音尚未暂停');
        const silenceTime = Date.now() - this._lastSilence!;
        this._writeSilenceData(silenceTime);
        this.listenStream.resume();
        logger.log(`RECORD 已继续对用户ID为${this.userId}的录音`);
        return this;
    }

    /**
     * Stop recording a user.
     * @returns {Promise<this>}
     */
    public async stopRecord (): Promise<this> {
        if(this.writeStream.writableFinished) return this;
        this.listenStream.push(null);
        this.listenStream.destroy();
        this.listenStream.off('data', this._writeRecordData);
        this.receiver.speaking.off('start', this._startSpeaking).off('stop', this._stopSpeaking);
        if (!this._isSpeaking && this._lastSilence) this._writeSilenceData(Date.now() - this._lastSilence);
        this.writeStream.end();
        logger.log(`RECORD 已停止对用户ID为${this.userId}的录音`);
        return new Promise<this>(resolve => this.writeStream.once('finish', () => resolve(this)));
    }

    /**
     * Rename the recording file.
     * Make sure that the user recording has been stopped or an error will be thrown.
     * @param {string} [fileName] This method will not take any effect if `fileName` is not given.
     * @returns {string} Return the file path that renamed if `fileName` is provided or the original file path.
     */
    public exportRecord (fileName?: string): string {
        if(!this.writeStream.writableFinished) throw new Error('录音尚未停止');
        if(!fileName) return this.tempRecordingFilePath;
        const newFilePath = path.join(audioOutputPath, fileName);
        renameSync(this.tempRecordingFilePath, newFilePath);
        logger.log(`RECORD ${this.tempRecordingFilePath}已被重新命名成${fileName}!`);
        return newFilePath;
    }

    /**
     * Compress the recording file.
     * Make sure that the user recording has been stopped or an error will be thrown.
     * @param {string} [fileName] The basename of the archive file will be the same as the recording file if `fileName` is not given.
     * @returns {Promise<string>} Return the archive file path.
     */
    public async exportRecordAsZip (fileName?: string): Promise<string> {
        if(!this.writeStream.writableFinished) throw new Error('录音尚未停止');
        const zipFilePath = path.join(audioOutputPath, path.basename(fileName ?? `${this.tempRecordingFilePath}.zip`));
        logger.log(`RECORD 开始压缩${this.tempRecordingFilePath}至${zipFilePath}`);
        await fileArchive(zipFilePath, this.tempRecordingFilePath);
        return zipFilePath;
    }
}

batchRecord
    .on('start', receiver => {
        const createNewRecord = (userId: string) => !recordings.has(userId) ? addUserRecording(userId, receiver) : null;
        if(receiver.speaking.listenerCount('start', createNewRecord)) return;
        receiver.speaking.users.forEach((shabi, userId) => createNewRecord(userId));
        receiver.speaking.on('start', createNewRecord);
        logger.log('RECORD 已开始对频道的录音');
    })
    .on('stop', async receiver => {
        if(!hasRecordings()) return;
        await Promise.all(mappedRecordings(recording => recording.stopRecord()));
        receiver.speaking.removeAllListeners('start');
        const zipFilePath = path.join(audioOutputPath, `${moment().tz(timeZone).format(outputTimeFormat)}.zip`);
        await fileArchive(zipFilePath, ...mappedRecordings(recording => recording.exportRecord()));
        clearAllRecording();
    })
    .on('clear', () => recordings.clear());