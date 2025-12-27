import type { Client, Message, ChatInputCommandInteraction, GuildMember } from "discord.js";
import { type VoiceConnection, getVoiceConnection } from "@discordjs/voice";
import path from 'path';
import config from '../config';
import { memberGet, reply, validFileName } from "../modules/functions";
import { addRecord, allRecord } from "../modules/recordBuffer";
import type { configCommandType } from '..';
import moment from "moment-timezone";
import { existsSync, lstatSync } from "fs";
import { OpusEncoder } from "@discordjs/opus";

export const run = (client: Client<true>, message: Message<true> | ChatInputCommandInteraction<'cached'>, args: string[]) => {
    const { outputTimeFormat, audioOutputPath, timeZone, sampleRate, channelCount, clientId } = config.settings;

    const member: GuildMember | undefined = memberGet(message, args[0]);
    if(!member) return reply(message, { content: '請指定一個用戶' });

    const fileName: string = args[1] || `${moment().tz(timeZone).format(outputTimeFormat)}.pcm`;
    const filePath = path.join(audioOutputPath, fileName);
    if(!validFileName(fileName)) return reply(message, { content: '輸入了無效的文件名' });
    if(existsSync(filePath) && args[2] !== 'true') return reply(message, { content: '該文件已存在' });
    if(existsSync(filePath) && !lstatSync(filePath).isFile()) return reply(message, { content: '該文件無法被覆寫' });

    const connection: VoiceConnection | undefined = getVoiceConnection(message.guild.id, clientId);
    if(!connection) return reply(message, { content: '機器人尚未加入語音頻道' });

    const voiceChannel = member.voice.channel;
    if(voiceChannel !== memberGet(message, clientId)?.voice.channel) return reply(message, { content: '該用戶並未與機器人處於同一頻道' });
    if(allRecord.has(member.id)) return reply(message, { content: '機器人早對該用戶錄音了' });

    addRecord(member.id, filePath, connection.receiver, Date.now(), new OpusEncoder(sampleRate, channelCount), false);
    return reply(message, { content: '正在錄音' });
};

export const conf: configCommandType = {
    name: 'record',
    permLevel: 'Owner',
    aliases: [],
    category: 'voice',
    args: new Map([
        ['用戶', { required: true, description: '想要錄哪個用戶', type: 'user' }],
        ['文件名稱', { required: false, description: '錄音後的文件名稱', type: 'string' }],
        ['覆写', { required: false, description: '是否覆写文件', type: 'boolean' }]
    ]),
    description: '對語音頻道錄音'
};