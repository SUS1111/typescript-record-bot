import type { ChatInputCommandInteraction, Client, Message, APIEmbedField } from "discord.js";
import { EmbedBuilder } from "discord.js";
import type { configCommandType } from "..";
import { reply } from '../modules/functions';
import { allRecord } from "../modules/recordBuffer";

export const run = async(client: Client, message: Message | ChatInputCommandInteraction) => {
    if(!client.user) return;
    if(allRecord.size === 0) return reply(message, { content: '机器人并未开始录音' });
    const fields: APIEmbedField[] = Array.from(allRecord, ([ userId, { beginTime, writeStream } ]) => {
        const fileSize = writeStream.bytesWritten / (1024 ** 2);
        const parseValue = `开始时间:<t:${Math.floor(beginTime / 1000)}:F>\n录音时长:<t:${Math.floor(beginTime / 1000)}:R>\n目前文件大小:${fileSize.toFixed(2)}MB`;
        return { name: message.guild?.members.cache.get(userId)?.user.username as string, value: parseValue };
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