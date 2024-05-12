import { type WriteStream, createWriteStream, rmSync } from 'fs';
import Archiver from 'archiver';
import config from '../config';
import path from 'path';

let allWriteStream: Map<string, WriteStream> = new Map();

const addWriteStream = (path: string, id: string): Map<string, WriteStream> => allWriteStream.set(id, createWriteStream(path, { encoding: 'binary', flags: 'a' }));
const writeFileStream = (id: string, data?: any): WriteStream | undefined => {
    const writeStream = allWriteStream.get(id);
    if(!writeStream) return;
    writeStream.write(data);
    return writeStream;
};
const stopwriteStream = (id: string): void => {
    const writeStream = allWriteStream.get(id);
    return writeStream ? writeStream.close() : void(0);
};
const fileToZip = (...filePaths: string[]): void => {
    const fullPath = (fileName: string): string => path.join(config.settings.dicPath, fileName);
    const output: WriteStream = createWriteStream(fullPath(`record-${Math.random().toString().substring(2)}.zip`));
    const archive: any = Archiver('zip', { zlib: { level: 9 }});
    filePaths.forEach((filePath: string) => archive.file(fullPath(filePath)));
    archive.pipe(output);
    archive.finalize();
    output.on('close', () => {
        console.log('進去了');
        filePaths.forEach((filePath: string) => rmSync(fullPath(filePath)));
    });
};
const getWriteStream = (id: string): WriteStream | undefined => allWriteStream.get(id);
const getAllWriteStream = (): Map<string, WriteStream> => allWriteStream;
const deleteWriteStream = (id: string): void => void(allWriteStream.delete(id));
const deleteAllWriteStream = (): void => allWriteStream.clear();

export { addWriteStream, writeFileStream, stopwriteStream, fileToZip, getWriteStream, getAllWriteStream, deleteWriteStream, deleteAllWriteStream };