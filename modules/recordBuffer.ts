import { type WriteStream, createWriteStream, writeFileSync } from 'fs';
import Archiver from 'archiver';
import { container } from '..';
import path from 'path';
import config from '../config';
import logger from './logger';

const { audioOutputPath, outputTimeFormat } = config.settings;
export const allRecord: Map<string, { data: Buffer[], fileName: string }> = new Map();

const extractRecord = (key: string): [Buffer[], string] => {
    const { data, fileName } = allRecord.get(key)!;
    return [data, fileName];
};

export const addRecord = (fileName: string, id: string): Buffer[] => {
    const data: Buffer[] = [];
    allRecord.set(id, { data, fileName });
    return data;
};
export const exportRecordAsZip = (keys: string[]): Promise<void> => {
    const output: WriteStream = createWriteStream(path.join(audioOutputPath, `record-${container.momentInit.format(outputTimeFormat)}.zip`));
    const archive: any = Archiver('zip', { zlib: { level: 9 }});
    keys.map(extractRecord).forEach(([data, fileName]) => archive.append(Buffer.concat(data), { name: path.basename(fileName) }));
    archive.pipe(output);
    archive.finalize();
    return new Promise<void>(resolve => output.on('close' , () => resolve(logger.log('文件已导出并压缩完成'))));
};
export const exportRecord = (keys: string[]) => keys.map(extractRecord).forEach(([data, fileName]) => {
    writeFileSync(fileName, Buffer.concat(data));
    logger.log(`${fileName}已成功导出`);
});