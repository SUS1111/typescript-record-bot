import { EmbedBuilder, bold, TimestampStyles, time, type APIEmbedField, type EmbedFooterData } from "discord.js";
import { type cmd, container } from "..";
import { memberGet, reply } from '../modules/functions';
import { hasRecordings, mappedRecordings, type UserRecord } from "../modules/recordings";

const generateRecordingData = ({ size: fileSize, isSpeaking, beginTimestamp, isPausing }: UserRecord) => {
    const { dayjs } = container;
    const beginTimeInSecond = Math.floor(beginTimestamp / 1000);
    return new Map([
        ['開始時間', time(beginTimeInSecond, TimestampStyles.FullDateShortTime)],
        ['錄音時長', dayjs.duration(dayjs().diff(dayjs(beginTimestamp))).format('HH:mm:ss')],
        ['目前文件大小', `${(fileSize / (1024 ** 2)).toFixed(2)} MB`],
        ['正在暫停中', isPausing ? '是' : '否'],
        ['正在説話中', isSpeaking ? '是' : '否']
    ]);
};

export const run: cmd['run'] = async message => {
    if(!hasRecordings()) return reply(message, { content: '機器人尚未收到任何数据包' });
    const fields: APIEmbedField[] = mappedRecordings(userRecording => {
        const recordingData = Array.from(generateRecordingData(userRecording), ([key, value]) => `${bold(key)}: ${value}`).join('\n');
        return { name: memberGet(message, userRecording.userId)!.user.username, value: recordingData };
    });
    const { client } = message.guild;
    const footer: EmbedFooterData = { text: client.user.username, iconURL: client.user.displayAvatarURL() };
    return reply(message, { embeds: [new EmbedBuilder({ title: '錄音狀況', fields, color: 0xFFF000, timestamp: Date.now(), footer })] });
}

export const conf: cmd['conf'] = {
    name: 'recordstatus',
    permLevel: 'Owner',
    aliases: ['status'],
    category: 'voice',
    args: new Map(),
    description: '匯出錄音狀況'
}