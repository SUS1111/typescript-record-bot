import type { ChatInputCommandInteraction, Client, Message, APIEmbedField } from "discord.js";
import { EmbedBuilder, bold, TimestampStyles, time } from "discord.js";
import type { configCommandType } from "..";
import { memberGet, reply } from '../modules/functions';
import { allRecord } from "../modules/recordBuffer";

export const run = async(client: Client<true>, message: Message<true> | ChatInputCommandInteraction<'cached'>) => {
    if(allRecord.size === 0) return reply(message, { content: '機器人尚未開始錄音' });
    const fields: APIEmbedField[] = Array.from(allRecord, ([ userId, { beginTime, writeStream, listenStream, isSpeaking, lastSilence } ]) => {
        const fileSize = writeStream.bytesWritten / (1024 ** 2);
        const data = new Map([
            ['開始時間', time(Math.floor(beginTime / 1000), TimestampStyles.FullDateShortTime)],
            ['錄音時長', time(Math.floor(beginTime / 1000), TimestampStyles.RelativeTime)],
            ['目前文件大小', `${fileSize.toFixed(2)} MB`],
            ['正在暫停中', listenStream.isPaused() ? '是' : '否'],
            ['正在説話中', isSpeaking === undefined ? '未知' : (isSpeaking ? '是' : '否')],
            ['機器人最後一次未接受數據包', lastSilence ? time(Math.floor(lastSilence / 1000), TimestampStyles.RelativeTime) : '未知']
        ]);
        return { name: memberGet(message, userId)?.user.username!, value: Array.from(data, ([key, value]) => `${bold(key)}: ${value}`).join('\n') };
    });
    const embed = new EmbedBuilder()
        .setTitle('錄音狀況')
        .addFields(fields)
        .setColor(0xFFFF00)
        .setTimestamp()
        .setFooter({ text: client.user.username, iconURL: client.user.displayAvatarURL() });
    return reply(message, { embeds: [embed] });
}

export const conf: configCommandType = {
    name: 'recordstatus',
    permLevel: 'Owner',
    aliases: ['status'],
    category: 'voice',
    args: new Map(),
    description: '匯出錄音狀況'
}