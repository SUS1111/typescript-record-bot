import { type WriteStream, createWriteStream, rmSync } from 'fs';
import Archiver from 'archiver';
import moment from 'moment-timezone';
import path from 'path';
import config from '../config';

export const allWriteStream: Map<string, WriteStream> = new Map();
const { audioOutputPath, timeZone, timeFormat } = config.settings;

export const addWriteStream = (path: string, id: string): WriteStream => {
    const writeStream = createWriteStream(path, { encoding: 'binary', flags: 'a' });
    allWriteStream.set(id, writeStream);
    return writeStream;
};
export const stopwriteStream = (id: string): void => {
    const writeStream = allWriteStream.get(id);
    return writeStream ? writeStream.close() : void(0);
};
export const fileToZip = (...filePaths: string[]): void => {
    const output: WriteStream = createWriteStream(path.join(audioOutputPath, `record-${moment.tz(timeZone).format(timeFormat)}.zip`));
    const archive: any = Archiver('zip', { zlib: { level: 9 }});
    filePaths.forEach((filePath: string) => archive.file(filePath));
    archive.pipe(output);
    archive.finalize();
    output.on('close', () => {
        console.log('進去了');
        filePaths.forEach((filePath: string) => rmSync(filePath));
    });
};
export const getWriteStream = (id: string): WriteStream | undefined => allWriteStream.get(id);
export const deleteWriteStream = (id: string): void => void(allWriteStream.delete(id));
export const deleteAllWriteStream = (): void => allWriteStream.clear();