import type { Client, Message, ChatInputCommandInteraction, GuildMember } from "discord.js";
import { type VoiceConnection, type AudioReceiveStream, getVoiceConnection } from "@discordjs/voice";
import { OpusEncoder } from "@discordjs/opus";
import path from 'path';
import config from '../config';
import { memberGet, reply, validFileName } from "../modules/functions";
import { addRecord, allRecord } from "../modules/recordBuffer";
import { container, type configCommandType } from '..';

export const run = (client: Client, message: Message | ChatInputCommandInteraction, args: string[]) => {
    const { outputTimeFormat, audioOutputPath } = config.settings;
    if(!message.guild || !client.user) return;
    const user: GuildMember | undefined = memberGet(message, args[0]);
    if(!user) return reply(message, { content: '請指定一個用戶' });
    const fileName: string = args[1] || `${container.momentInit.format(outputTimeFormat)}.pcm`;
    const connection: VoiceConnection | undefined = getVoiceConnection(message.guild.id, client.user.id);
    if(!validFileName(fileName)) return reply(message, { content: '输入了无效的文件名或是文件名过长' });
    if(!connection) return reply(message, { content: '機器人尚未加入語音頻道' });
    if(allRecord.has(user.id)) return reply(message, { content: '机器人早就对该用户录音了' });
    const encoder: OpusEncoder = new OpusEncoder(48000, 2);
    const listenStream: AudioReceiveStream = connection.receiver.subscribe(user.id);
    const recordData: Buffer[] = addRecord(user.id, path.join(audioOutputPath, fileName), listenStream);
    listenStream.on('data', chunk => recordData.push(encoder.decode(chunk)));
    return reply(message, { content: '正在錄音' });
};

export const conf: configCommandType = {
    name: 'record',
    permLevel: 'Owner',
    aliases: [],
    category: 'voice',
    args: new Map([
        ['用戶', { required: true, description: '想要錄哪個用戶', type: 'user' }],
        ['文件名稱', { required: false, description: '錄音後的文件名稱', type: 'string' }]
    ]),
    description: '對語音頻道錄音'
};