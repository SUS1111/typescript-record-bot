interface recordObject {
    filePath: string,
    listenStream: AudioReceiveStream,
    beginTime: number,
    writeStream: WriteStream,
    lastSilence?: number,
    isSpeaking?: boolean,
    encoder: OpusEncoder
}

import { type WriteStream, createWriteStream } from 'fs';
import Archiver from 'archiver';
import moment from 'moment-timezone';
import path from 'path';
import config from '../config';
import logger from './logger';
import type { AudioReceiveStream, VoiceReceiver } from '@discordjs/voice';
import { OpusEncoder } from '@discordjs/opus';

const { audioOutputPath, outputTimeFormat, timeZone, sampleRate, channelCount } = config.settings;
let wantListenChannel: boolean;
let clientReceiver: VoiceReceiver;
export const magicNumber = (sampleRate * 2 * channelCount) / 1000; // Size of 16-bit PCM file in 1 ms
export const allRecord: Map<string, recordObject> = new Map();

const extractRecord = (key: string): [string, WriteStream, number, boolean] => {
    const { filePath, writeStream, isSpeaking } = allRecord.get(key)!;
    return [filePath, writeStream, allRecord.get(key)?.lastSilence ?? Date.now(), isSpeaking ?? false];
};

const writeRecordData = (writeStram: WriteStream, encoder: OpusEncoder) => (chunk: Buffer) => writeStram.write(encoder.decode(chunk));

const startSpeaking = (userId: string) => {
    let userRecording: recordObject | undefined = allRecord.get(userId);
    if(!userRecording && wantListenChannel) {
        const fileName: string = `${moment().tz(timeZone).format(outputTimeFormat)}-${userId}.pcm`;
        const filePath = path.join(audioOutputPath, fileName);
        const listenStream = clientReceiver.subscribe(userId);
        const writeStream = createWriteStream(filePath);
        userRecording = { filePath, encoder: new OpusEncoder(sampleRate, channelCount), writeStream, listenStream, beginTime: Date.now() }
        allRecord.set(userId, userRecording);
    }
    if((!userRecording && !wantListenChannel) || allRecord.get(userId)?.listenStream.isPaused()) return;
    const { listenStream, writeStream, lastSilence, beginTime, encoder } = userRecording!;
    listenStream.removeAllListeners('data');
    const silenceTime = Date.now() - (lastSilence ?? beginTime);
    writeStream.write(Buffer.alloc(silenceTime * magicNumber));
    listenStream.on('data', writeRecordData(writeStream, encoder));
    userRecording!.isSpeaking = true;
};

const stopSpeaking = (userId: string) => {
    if(!allRecord.has(userId) || allRecord.get(userId)?.listenStream.isPaused()) return;
    allRecord.set(userId, { ...allRecord.get(userId)!, lastSilence: Date.now() });
    const userRecording = allRecord.get(userId)!;
    userRecording.listenStream.removeAllListeners('data');
    userRecording.isSpeaking = false;
};

export const addRecord = (userId: string, filePath: string, receiver: VoiceReceiver, beginTime: number, encoder: OpusEncoder, listenChannel: boolean): void => {
    const listenStream = receiver.subscribe(userId);
    const writeStream = createWriteStream(filePath);
    allRecord.set(userId, { filePath, beginTime, listenStream, writeStream, encoder });
    clientReceiver = receiver;
    wantListenChannel = listenChannel;
    const speakingMap = receiver.speaking;
    if(speakingMap.users.has(userId)) listenStream.on('data', writeRecordData(writeStream, encoder));
    if(!speakingMap.listenerCount('start')) speakingMap.on('start', startSpeaking);
    if(!speakingMap.listenerCount('end')) speakingMap.on('end', stopSpeaking);
};

export const exportRecordAsZip = (keys: string[]): Promise<void> => {
    const output: WriteStream = createWriteStream(path.join(audioOutputPath, `record-${moment().tz(timeZone).format(outputTimeFormat)}.zip`));
    const archive = Archiver('zip', { zlib: { level: 9 }});
    keys.map(extractRecord).forEach(([filePath, writeStream, lastSilence, isSpeaking]) => {
        if (!isSpeaking) writeStream.write(Buffer.alloc((Date.now() - lastSilence) * magicNumber));
        writeStream.end();
        wantListenChannel = false;
        archive.file(writeStream.path.toString(), { name: path.basename(filePath) });
    });
    archive.pipe(output);
    archive.finalize();
    return new Promise<void>(resolve => output.on('close' , () => resolve(logger.log('RECORD 文件已导出并压缩完成'))));
};

export const exportRecord = (keys: string[]): void => keys.map(extractRecord).forEach(([filePath, writeStream, lastSilence, isSpeaking]) => {
    if (!isSpeaking) writeStream.write(Buffer.alloc((Date.now() - lastSilence) * magicNumber));
    writeStream.end();
    wantListenChannel = false;
    logger.log(`RECORD ${path.basename(filePath)}已成功导出`);
});