interface recordObject {
    fileName: string,
    receiver: VoiceReceiver,
    listenStream: AudioReceiveStream,
    beginTime: number,
    writeStream: WriteStream,
    lastSilence?: number,
    isSpeaking?: boolean
}

import { type WriteStream, createWriteStream } from 'fs';
import Archiver from 'archiver';
import moment from 'moment-timezone';
import path from 'path';
import config from '../config';
import logger from './logger';
import type { AudioReceiveStream, VoiceReceiver } from '@discordjs/voice';
import { OpusEncoder } from '@discordjs/opus';

const { audioOutputPath, outputTimeFormat, timeZone } = config.settings;
const encoder = new OpusEncoder(48000, 2);
export const magicNumber = 192; // Size of 16 bit 48000Hz stereo audio PCM file in 1 ms
export const allRecord: Map<string, recordObject> = new Map();

const extractRecord = (key: string): [string, WriteStream, number, boolean] => {
    const { fileName, writeStream, isSpeaking } = allRecord.get(key)!;
    return [fileName, writeStream, allRecord.get(key)?.lastSilence ?? Date.now(), isSpeaking ?? false];
};

const writeRecordData = (writeStram: WriteStream) => (chunk: Buffer) => writeStram.write(encoder.decode(chunk));

const startSpeaking = (userId: string) => {
    const userRecording = allRecord.get(userId);
    if(!userRecording || allRecord.get(userId)?.listenStream.isPaused()) return;
    const { listenStream, writeStream, lastSilence, beginTime } = userRecording;
    listenStream.removeAllListeners('data');
    const silenceTime = Date.now() - (lastSilence ?? beginTime);
    writeStream.write(Buffer.alloc(silenceTime * magicNumber));
    listenStream.on('data', writeRecordData(writeStream));
    userRecording.isSpeaking = true;
};

const stopSpeaking = (userId: string) => {
    if(!allRecord.has(userId) || allRecord.get(userId)?.listenStream.isPaused()) return;
    allRecord.set(userId, { ...allRecord.get(userId)!, lastSilence: Date.now() });
    const userRecording = allRecord.get(userId)!;
    userRecording.listenStream.removeAllListeners('data');
    userRecording.isSpeaking = false;
};

export const addRecord = (id: string, fileName: string, receiver: VoiceReceiver, beginTime: number, writeStream: WriteStream): void => {
    const listenStream = receiver.subscribe(id);
    allRecord.set(id, { fileName, receiver, beginTime, listenStream, writeStream });
    const speakingMap = receiver.speaking;
    listenStream.on('data', writeRecordData(writeStream));
    speakingMap.on('start', startSpeaking);
    speakingMap.on('end', stopSpeaking);
};

export const exportRecordAsZip = (keys: string[]): Promise<void> => {
    const output: WriteStream = createWriteStream(path.join(audioOutputPath, `record-${moment().tz(timeZone).format(outputTimeFormat)}.zip`));
    const archive = Archiver('zip', { zlib: { level: 9 }});
    keys.map(extractRecord).forEach(([fileName, writeStream, lastSilence, isSpeaking]) => {
        if (!isSpeaking) writeStream.write(Buffer.alloc((Date.now() - lastSilence) * magicNumber));
        writeStream.end();
        archive.file(writeStream.path.toString(), { name: path.basename(fileName) });
    });
    archive.pipe(output);
    archive.finalize();
    return new Promise<void>(resolve => output.on('close' , () => resolve(logger.log('RECORD 文件已导出并压缩完成'))));
};

export const exportRecord = (keys: string[]): void => keys.map(extractRecord).forEach(([fileName, writeStream, lastSilence, isSpeaking]) => {
    if (!isSpeaking) writeStream.write(Buffer.alloc((Date.now() - lastSilence) * magicNumber));
    writeStream.end();
    logger.log(`RECORD ${path.basename(fileName)}已成功导出`);
});