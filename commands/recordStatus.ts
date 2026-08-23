import { EmbedBuilder, bold, TimestampStyles, time, type APIEmbedField } from "discord.js";
import type { cmd } from "..";
import { memberGet, reply } from '../modules/functions';
import { recordings, type UserRecord } from "../modules/recordings";

const generateRecordingData = ({ lastSilence, size: fileSize, isSpeaking, beginTime, isPausing }: UserRecord) => {
    const beginTimeInSecond = Math.floor(beginTime / 1000);
    return new Map([
        ['開始時間', time(beginTimeInSecond, TimestampStyles.FullDateShortTime)],
        ['錄音時長', time(beginTimeInSecond, TimestampStyles.RelativeTime)],
        ['目前文件大小', `${(fileSize / (1024 ** 2)).toFixed(2)} MB`],
        ['正在暫停中', isPausing ? '是' : '否'],
        ['正在説話中', isSpeaking === undefined ? '未知' : (isSpeaking ? '是' : '否')],
        ['機器人最後一次未接受數據包', lastSilence ? time(Math.floor(lastSilence / 1000), TimestampStyles.RelativeTime) : '未知']
    ]);
};

export const run: cmd['run'] = async(client, message) => {
    if(recordings.size === 0) return reply(message, { content: '機器人尚未收到任何数据包' });
    const fields: APIEmbedField[] = Array.from(recordings, ([userId, userRecording]) => {
        const recordingData = generateRecordingData(userRecording);
        return { name: memberGet(message, userId)!.user.username, value: Array.from(recordingData, ([key, value]) => `${bold(key)}: ${value}`).join('\n') };
    });
    const embed = new EmbedBuilder()
        .setTitle('錄音狀況')
        .addFields(fields)
        .setColor(0xFFFF00)
        .setTimestamp()
        .setFooter({ text: client.user.username, iconURL: client.user.displayAvatarURL() });
    return reply(message, { embeds: [embed] });
}

export const conf: cmd['conf'] = {
    name: 'recordstatus',
    permLevel: 'Owner',
    aliases: ['status'],
    category: 'voice',
    args: new Map(),
    description: '匯出錄音狀況'
}