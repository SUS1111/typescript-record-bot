interface BatchRecordEvent {
    start: [receiver: VoiceReceiver];
    stop: [receiver: VoiceReceiver];
    finishStop: [success: boolean];
    export: [exportAsZip: boolean, fileName: string];
    finishExport: [success: boolean];
    clear: []
}
type UserRecordOptions = { userId: string, receiver: VoiceReceiver, beginTime?: number };

import { type WriteStream, createWriteStream, renameSync } from 'fs';
import { container } from '..';
import path from 'path';
import config from '../config';
import logger from './logger';
import type { AudioReceiveStream, VoiceReceiver } from '@discordjs/voice';
import { OpusEncoder } from '@discordjs/opus';
import { EventEmitter, once } from 'events';
import { fileArchive, validFileName } from './functions';

const { dayjs } = container;
const { audioOutputPath, outputTimeFormat, timeZone, sampleRate, channelCount } = config.settings;
const chunkPerMs = (sampleRate * 2 * channelCount) / 1000; // Size of 16-bit PCM file in 1 ms
const batchRecord = new EventEmitter<BatchRecordEvent>().setMaxListeners(6);
const recordings = new Map<string, UserRecord>();

export const startChannelRecord = (receiver: VoiceReceiver) => batchRecord.emit('start', receiver);
export const stopAllRecording = (receiver: VoiceReceiver) => {
    return new Promise<void>(resolve => {
        batchRecord.once('finishStop', success => resolve(logger.log(`RECORD ${success ? '已停止对所有用户的录音' : '机器人并未开始录音'}`))).emit('stop', receiver);
    });
};
export const exportAllRecording = (exportAsZip: boolean, fileName =`${dayjs().tz(timeZone).format(outputTimeFormat)}.zip`) => {
    return new Promise<void>(resolve => {
        batchRecord.once('finishExport', success => resolve(!success ? logger.log('RECORD 机器人并未压缩文件') : void(0))).emit('export', exportAsZip, fileName);
    });
};
export const clearAllRecording = () => batchRecord.emit('clear');
export const addUserRecording = (option: UserRecordOptions) => recordings.set(option.userId, new UserRecord(option));
export const getUserRecording = (userId: string) => recordings.get(userId);
export const deleteUserRecording = (userId: string) => recordings.delete(userId);
export const hasRecordings = () => recordings.size !== 0;
export const mappedRecordings = <Type>(mapFunc: (v: UserRecord, k: number) => Type) => Array.from(recordings.values(), mapFunc);

export class UserRecord {
    public readonly userId: string;
    public readonly beginTime: number;
    public readonly encoder: OpusEncoder;
    private _lastTimeAcceptData?: number;
    public readonly listenStream: AudioReceiveStream;
    public readonly writeStream: WriteStream;
    private _isPausing: boolean;
    public readonly tempRecordingFilePath: string;
    public readonly receiver: VoiceReceiver;

    private readonly _startSpeaking = (userId: string) => {
        const { listenStream, beginTime, isPausing, _lastTimeAcceptData, _writeRecordData, _getExactTime, _generateSilenceChunk } = this;
        if (userId !== this.userId || isPausing) return;
        listenStream.removeAllListeners('data');
        const silenceTime = _getExactTime() - (_lastTimeAcceptData ?? beginTime);
        listenStream.on('data', _writeRecordData).push(_generateSilenceChunk(silenceTime));
    }

    private readonly _stopSpeaking = (userId: string) => {
        if (userId !== this.userId || this.isPausing) return;
        this._lastTimeAcceptData = this._getExactTime();
        this.listenStream.removeAllListeners('data');
    }

    private readonly _writeRecordData = async (chunk: Buffer) => {
        const safeForNextWrite = this.writeStream.write(chunk.equals(Buffer.alloc(chunk.length)) ? chunk : this.encoder.decode(chunk));
        if(!safeForNextWrite && this.writeStream.listenerCount('drain') === 0) await once(this.writeStream, 'drain');
    }

    private readonly _generateSilenceChunk = (durationInMs: number) => Buffer.alloc(durationInMs * chunkPerMs);

    private readonly _getExactTime = () => Math.floor(performance.now());

    constructor ({ userId, receiver, beginTime: specifiedBeginTime }: UserRecordOptions) {
        const listenStream = receiver.subscribe(userId).setMaxListeners(1);
        const filePath = path.join(audioOutputPath, `${dayjs().tz(timeZone).format(outputTimeFormat)}-${userId}.pcm`);
        const writeStream = createWriteStream(filePath);
        const encoder = new OpusEncoder(sampleRate, channelCount);
        const speakingMap = receiver.speaking;

        this.userId = userId;
        this.receiver = receiver;
        this.encoder = encoder;
        this.listenStream = listenStream;
        this.writeStream = writeStream;
        this.tempRecordingFilePath = filePath;
        this._isPausing = false;
        this.beginTime = specifiedBeginTime ?? this._getExactTime();

        if(specifiedBeginTime || this.isSpeaking) listenStream.on('data', this._writeRecordData);
        if(specifiedBeginTime) listenStream.push(this._generateSilenceChunk(this._getExactTime() - specifiedBeginTime));
        if(!speakingMap.listenerCount('start', this._startSpeaking)) speakingMap.on('start', this._startSpeaking);
        if(!speakingMap.listenerCount('end', this._stopSpeaking)) speakingMap.on('end', this._stopSpeaking);

        logger.log(`已开始对用户ID为${userId}的录音`);
    }

    public get isSpeaking() {
        return this.receiver.speaking.users.has(this.userId);
    }

    public get isPausing() {
        return this._isPausing;
    }

    public get size() {
        return this.writeStream.bytesWritten;
    }

    public get beginTimestamp() {
        return Math.floor(performance.timeOrigin) + this.beginTime;
    }

    /**
     * Pause recording a user. Make sure that the user has not paused or an error will be thrown.
     * @returns {this}
     */
    public pauseRecord(): this {
        if(this.isPausing) throw new Error('录音早已暂停');
        this.listenStream.removeAllListeners('data');
        this._lastTimeAcceptData = Math.min(this._getExactTime(), this._lastTimeAcceptData ?? Number.MAX_SAFE_INTEGER);
        this._isPausing = true;
        logger.log(`RECORD 已暂停对用户ID为${this.userId}的录音`);
        return this;
    }

    /**
     * Resume recording a user. Make sure that the user has already paused or an error will be thrown.
     * @returns {this}
     */
    public resumeRecord (): this {
        if (!this.isPausing) throw new Error('录音尚未暂停');
        const silenceTime = this._getExactTime() - this._lastTimeAcceptData!;
        this.listenStream.on('data', this._writeRecordData).push(this._generateSilenceChunk(silenceTime));
        this._lastTimeAcceptData = this._getExactTime();
        this._isPausing = false;
        logger.log(`RECORD 已继续对用户ID为${this.userId}的录音`);
        return this;
    }

    /**
     * Stop recording a user.
     * @returns {Promise<this>}
     */
    public async stopRecord (): Promise<this> {
        const { writeStream, listenStream, isPausing, isSpeaking, receiver, _lastTimeAcceptData, _startSpeaking, _stopSpeaking, _generateSilenceChunk, _getExactTime } = this;
        if(writeStream.writableFinished) return this;
        listenStream.push(null);
        const silenceChunk = _generateSilenceChunk((!isSpeaking || isPausing) ? (_getExactTime() - _lastTimeAcceptData!) : 0);
        writeStream.end(silenceChunk);
        await once(writeStream, 'finish');
        listenStream.destroy().removeAllListeners('data');
        receiver.speaking.off('start', _startSpeaking).off('end', _stopSpeaking);
        logger.log(`RECORD 已停止对用户ID为${this.userId}的录音`);
        return this;
    }

    /**
     * Rename the recording file.
     * Make sure that the user recording has been stopped and the file name is valid or an error will be thrown.
     * @param {string} [fileName] This method will not take any effect if `fileName` is not given.
     * @returns {string} Return the file path that renamed if `fileName` is provided or the original file path if `fileName` is not given.
     */
    public exportRecord (fileName?: string): string {
        if(!this.writeStream.writableFinished) throw new Error('录音尚未停止');
        if(!fileName) return this.tempRecordingFilePath;
        if(!validFileName(path.basename(fileName))) throw new TypeError('文件名不合法');
        const newFilePath = path.join(audioOutputPath, path.basename(fileName));
        renameSync(this.tempRecordingFilePath, newFilePath);
        logger.log(`RECORD ${this.tempRecordingFilePath}已被重新命名成${fileName}!`);
        return newFilePath;
    }

    /**
     * Compress the recording file.
     * Make sure that the user recording has been stopped or an error will be thrown.
     * @param {string} [fileName] The basename of the archive file will be the same as the recording file if `fileName` is not given or invalid.
     * @returns {Promise<string>} Return the archive file path.
     */
    public async exportRecordAsZip (fileName: string = `${this.tempRecordingFilePath}.zip`): Promise<string> {
        if(!this.writeStream.writableFinished) throw new Error('录音尚未停止');
        const safeFileName = validFileName(fileName) ? path.basename(fileName) : `${this.tempRecordingFilePath}.zip`;
        if(fileName !== safeFileName) logger.warn(`原本文件名${fileName}并不合法，已被替换成${safeFileName}`);
        const zipFilePath = path.join(audioOutputPath, safeFileName);
        logger.log(`RECORD 开始压缩${this.tempRecordingFilePath}至${zipFilePath}`);
        await fileArchive(zipFilePath, this.tempRecordingFilePath);
        return zipFilePath;
    }
}

batchRecord
    .on('start', receiver => {
        const createNewRecord = (startTime: number, userId: string) => !getUserRecording(userId) ? addUserRecording({ userId, receiver, beginTime: startTime }) : null;
        if(receiver.speaking.listenerCount('start', createNewRecord)) return;
        const startTime = Math.floor(performance.now());
        receiver.speaking.users.forEach((_startSpeakingTime, userId) => createNewRecord(startTime, userId));
        receiver.speaking.on('start', createNewRecord.bind(null, startTime));
        logger.log('RECORD 已开始对频道的录音');
    })
    .on('stop', async receiver => {
        if(!hasRecordings()) return batchRecord.emit('finishStop', false);
        await Promise.all(mappedRecordings(recording => recording.stopRecord()));
        receiver.speaking.removeAllListeners('start');
        return batchRecord.emit('finishStop', true);
    })
    .on('export', async (exportAsZip, fileName) => {
        if(!exportAsZip || !hasRecordings()) return batchRecord.emit('finishExport', false);
        const zipFilePath = path.join(audioOutputPath, path.basename(fileName));
        await fileArchive(zipFilePath, ...mappedRecordings(recording => recording.exportRecord()));
        return batchRecord.emit('finishExport', true);
    })
    .on('clear', () => recordings.clear());