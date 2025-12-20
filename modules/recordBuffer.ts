import { type WriteStream, createWriteStream } from 'fs';
import Archiver from 'archiver';
import moment from 'moment-timezone';
import path from 'path';
import config from '../config';
import logger from './logger';
import type { AudioReceiveStream, VoiceReceiver } from '@discordjs/voice';
import { OpusEncoder } from '@discordjs/opus';

const { audioOutputPath, outputTimeFormat, timeZone } = config.settings;
export const allRecord: Map<string, { fileName: string, receiver: VoiceReceiver, listenStream: AudioReceiveStream, beginTime: number, writeStream: WriteStream }> = new Map();

const extractRecord = (key: string): [string, WriteStream] => {
    const { fileName, writeStream } = allRecord.get(key)!;
    return [fileName, writeStream];
};

export const addRecord = (id: string, fileName: string, receiver: VoiceReceiver, beginTime: number, writeStream: WriteStream) => {
    const listenStream = receiver.subscribe(id);
    allRecord.set(id, { fileName, receiver, beginTime, listenStream, writeStream });
    const encoder = new OpusEncoder(48000, 2);
    listenStream.on('data', chunk => writeStream.write(encoder.decode(chunk)));
};

export const exportRecordAsZip = (keys: string[]): Promise<void> => {
    const output: WriteStream = createWriteStream(path.join(audioOutputPath, `record-${moment().tz(timeZone).format(outputTimeFormat)}.zip`));
    const archive: any = Archiver('zip', { zlib: { level: 9 }});
    keys.map(extractRecord).forEach(([fileName, writeStream]) => {
        archive.file(writeStream.path.toString(), { name: path.basename(fileName) });
        writeStream.end();
    });
    archive.pipe(output);
    archive.finalize();
    return new Promise<void>(resolve => output.on('close' , () => resolve(logger.log('RECORD 文件已导出并压缩完成'))));
};

export const exportRecord = (keys: string[]): void => keys.map(extractRecord).forEach(([fileName, writeStream]) => {
    writeStream.end();
    logger.log(`RECORD ${path.basename(fileName)}已成功导出`);
});