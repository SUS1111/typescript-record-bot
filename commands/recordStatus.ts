import type { ChatInputCommandInteraction, Client, Message, APIEmbedField } from "discord.js";
import { EmbedBuilder } from "discord.js";
import type { configCommandType } from "..";
import { type VoiceConnection, getVoiceConnection } from "@discordjs/voice";
import { reply } from '../modules/functions';
import { allRecord } from "../modules/recordBuffer";

export const run = async(client: Client, message: Message | ChatInputCommandInteraction) => {
    if(!message.guildId || !client.user) return;
    const connection: VoiceConnection | undefined = getVoiceConnection(message.guildId, client.user.id);
    if(!connection) return reply(message, { content: '機器人尚未加入語音頻道' });
    if(allRecord.size === 0) return reply(message, { content: '机器人并未开始录音' });
    const fields: APIEmbedField[] = Array.from(allRecord, ([ key, value ]) => {
        const predictFileSize = (Math.floor(48000*2*2*(Date.now() - value.beginTime) / 1000)) / (1024 ** 2);
        const parseValue = `开始时间:<t:${Math.floor(value.beginTime / 1000)}:F>\n录音时长:<t:${Math.floor(value.beginTime / 1000)}:R>\n预计文件大小:${predictFileSize}MB`;
        return { name: message.guild?.members.cache.get(key)?.user.username as string, value: parseValue };
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