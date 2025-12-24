import type { ChatInputCommandInteraction, Client, Message, APIEmbedField } from "discord.js";
import { EmbedBuilder, bold, TimestampStyles, time } from "discord.js";
import type { configCommandType } from "..";
import { memberGet, reply } from '../modules/functions';
import { allRecord } from "../modules/recordBuffer";

export const run = async(client: Client<true>, message: Message<true> | ChatInputCommandInteraction<'cached'>) => {
    if(allRecord.size === 0) return reply(message, { content: '机器人并未开始录音' });
    const fields: APIEmbedField[] = Array.from(allRecord, ([ userId, { beginTime, writeStream, listenStream, isSpeaking, lastSilence } ]) => {
        const fileSize = writeStream.bytesWritten / (1024 ** 2);
        const data = new Map([
            ['开始时间', time(Math.floor(beginTime / 1000), TimestampStyles.FullDateShortTime)],
            ['录音时长', time(Math.floor(beginTime / 1000), TimestampStyles.RelativeTime)],
            ['目前文件大小', `${fileSize.toFixed(2)}MB`],
            ['正在暂停中', listenStream.isPaused() ? '是' : '否'],
            ['正在说话中', isSpeaking === undefined ? '未知' : (isSpeaking ? '是' : '否')],
            ['最后一次不说话', lastSilence === undefined ? '未知' : (lastSilence ? time(Math.floor(lastSilence / 1000), TimestampStyles.RelativeTime) : '自录音起尚未停止说话')]
        ]);
        return { name: memberGet(message, userId)?.user.username as string, value: Array.from(data, ([key, value]) => `${bold(key)}:${value}`).join('\n') };
    });
    const embed = new EmbedBuilder()
        .setTitle('录音状况')
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
    description: '输出录音状态'
}