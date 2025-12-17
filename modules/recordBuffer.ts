import { type WriteStream, createWriteStream, writeFileSync } from 'fs';
import Archiver from 'archiver';
import moment from 'moment-timezone';
import path from 'path';
import config from '../config';
import logger from './logger';
import type { AudioReceiveStream } from '@discordjs/voice';

const { audioOutputPath, outputTimeFormat, timeZone } = config.settings;
export const allRecord: Map<string, { data: Buffer[], fileName: string, listenStream: AudioReceiveStream }> = new Map();

const extractRecord = (key: string): [Buffer[], string] => {
    const { data, fileName } = allRecord.get(key)!;
    return [data, fileName];
};

export const addRecord = (id: string, fileName: string, listenStream: AudioReceiveStream): Buffer[] => {
    const data: Buffer[] = [];
    allRecord.set(id, { data, fileName, listenStream });
    return data;
};
export const exportRecordAsZip = (keys: string[]): Promise<void> => {
    const output: WriteStream = createWriteStream(path.join(audioOutputPath, `record-${moment().tz(timeZone).format(outputTimeFormat)}.zip`));
    const archive: any = Archiver('zip', { zlib: { level: 9 }});
    keys.map(extractRecord).forEach(([data, fileName]) => archive.append(Buffer.concat(data), { name: path.basename(fileName) }));
    archive.pipe(output);
    archive.finalize();
    return new Promise<void>(resolve => output.on('close' , () => resolve(logger.log('文件已导出并压缩完成'))));
};

export const exportRecord = (keys: string[]): void => keys.map(extractRecord).forEach(([data, fileName]) => {
    writeFileSync(fileName, Buffer.concat(data));
    logger.log(`RECORD ${fileName}已成功导出`);
});