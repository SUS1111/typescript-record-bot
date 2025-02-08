import { type WriteStream, createWriteStream, rmSync } from 'fs';
import Archiver from 'archiver';
import moment from 'moment-timezone';
import path from 'path';
import config from '../config';

export const allRecord: Map<string, { data: Buffer[], fileName: string }> = new Map();
const { audioOutputPath, timeZone, timeFormat } = config.settings;

export const addRecord = (fileName: string, id: string, data: Buffer[] = []) : Buffer[] => {
    allRecord.set(id, { data, fileName });
    return data;
};
export const fileToZip = (...keys: string[]): void => {
    const output: WriteStream = createWriteStream(path.join(audioOutputPath, `record-${moment.tz(timeZone).format(timeFormat)}.zip`));
    const archive: any = Archiver('zip', { zlib: { level: 9 }});
    keys.forEach((key: string) => {
        const record = allRecord.get(key);
        if(!record) return;
        const { data, fileName } = record;
        archive.append(Buffer.concat(data), { name: path.basename(fileName) });
    });
    archive.pipe(output);
    archive.finalize();
    output.on('close', () => console.log('進去了'));
};