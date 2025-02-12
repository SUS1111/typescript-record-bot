import { type WriteStream, createWriteStream, writeFileSync } from 'fs';
import Archiver from 'archiver';
import moment from 'moment-timezone';
import path from 'path';
import config from '../config';
import logger from './logger';

const { audioOutputPath, timeZone, outputTimeFormat } = config.settings;
export const allRecord: Map<string, { data: Buffer[], fileName: string }> = new Map();

export const addRecord = (fileName: string, id: string, data: Buffer[] = []) : Buffer[] => {
    allRecord.set(id, { data, fileName });
    return data;
};
export const exportRecordAsZip = (...keys: string[]): void => {
    const output: WriteStream = createWriteStream(path.join(audioOutputPath, `record-${moment.tz(timeZone).format(outputTimeFormat)}.zip`));
    const archive: any = Archiver('zip', { zlib: { level: 9 }});
    keys.forEach((key: string) => {
        const record = allRecord.get(key);
        if(!record) return;
        const { data, fileName } = record;
        archive.append(Buffer.concat(data), { name: path.basename(fileName) });
    });
    archive.pipe(output);
    archive.finalize();
    output.on('close', () => logger.log('文件已导出并压缩完成'));
};
export const exportRecord = (...keys: string[]): void => keys.forEach((key: string) => {
    const record = allRecord.get(key);
    if(!record) return;
    const { data, fileName } = record;
    writeFileSync(fileName, Buffer.concat(data));
    logger.log(`${fileName}已成功导出`);
});