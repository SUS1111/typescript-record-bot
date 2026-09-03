import { getVoiceConnection } from "@discordjs/voice";
import { getMemberId, reply, validFileName } from '../modules/functions';
import { stopAllRecording, clearAllRecording, getUserRecording, mappedRecordings, exportAllRecording, deleteUserRecording } from "../modules/recordings";
import type { cmd } from "..";

export const run: cmd['run'] = async(message, args) => {
    const connection = getVoiceConnection(message.guildId);
    if(!connection) return reply(message, { content: '機器人尚未加入語音頻道' });

    const wantExportAsZip = args[0]?.toLowerCase() === 'true';
    const memberId = getMemberId(args[1]);
    const userRecording = getUserRecording(memberId ?? '');
    const fileName = args[2];

    if(fileName && !validFileName(fileName)) return reply(message, { content: '这是个无效的文件名字' });
    if(!memberId) {
        if(!wantExportAsZip && fileName) return reply(message, { content: '若不想指定用户又想指定文件名称，则必须压缩成单一文件' });
        await stopAllRecording(connection.receiver);
        await exportAllRecording(wantExportAsZip, fileName);
    } else {
        if(!userRecording) return reply(message, { content: '機器人尚未對該用戶錄音' });
        await userRecording.stopRecord().then(result => wantExportAsZip ? result.exportRecordAsZip(fileName) : result.exportRecord(fileName));
        deleteUserRecording(memberId);
    }

    if(mappedRecordings(recording => recording.writeStream.writableFinished).every(value => value)) clearAllRecording();

    return reply(message, { content: '機器人已停止并匯出錄音(倘若无文件表示无人被录音)' });
};

export const conf: cmd['conf'] = {
    name: 'stop',
    permLevel: 'Owner',
    aliases: [],
    category: 'voice',
    args: new Map([
        ['是否壓縮成zip檔案', { required: false, description: '是寫true 否寫false', type: 'boolean' }],
        ['用戶', { required: false, description: '想要停止錄音的用戶 不填則則是停止所有錄音', type: 'user' }],
        ['文件名字', { required: false, description: '录音文件的名字 不填则使用默认名字', type: 'string' }]
    ]),
    description: '停止對成員進行錄音，切勿在指令执行期间重复使用'
};