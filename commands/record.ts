import { Client, Message, ChatInputCommandInteraction, GuildMember, User, chatInputApplicationCommandMention } from "discord.js";
import { VoiceConnection, AudioReceiveStream, getVoiceConnection } from "@discordjs/voice";
import { OpusEncoder } from "@discordjs/opus";
import { createWriteStream } from 'fs';
import path from 'path';
import config from '../config';
import { Readable } from 'stream';
import { reply, writeFileStream } from "../modules/functions";

interface conf { name: string; permLevel: string; aliases: string[], category: string, args: Map<string, { required: boolean, description: string, type: string }>, description: string };

export const run = (client: Client, message: Message | ChatInputCommandInteraction, args: string[]) => {
    if(!message.guildId || !client.user) return;
    const user: GuildMember | User | undefined = message instanceof Message ? message.mentions.members?.first() || message.guild?.members.cache.get(args[0]) : message.guild?.members.cache.get(args[0]);
    if(!user) return reply(message, { content: '請指定一個用戶' });
    const fileName: string = args[1] || Date.now().toString();
    const connection: VoiceConnection | undefined = getVoiceConnection(message.guildId, client.user.id);
    if(!connection) return reply(message, { content: '機器人尚未加入語音頻道' });
    const encoder: OpusEncoder = new OpusEncoder(48000, 2);
    const subsription: AudioReceiveStream = connection.receiver.subscribe(user.id);
    subsription.on('data', chunk => writeFileStream(`${path.join(config.settings.dicPath, fileName)}.ogg`, false, encoder.decode(chunk)));
    return reply(message, { content: '正在錄音' });
}

export const conf: conf = {
    name: 'record',
    permLevel: 'Owner',
    aliases: [],
    category: 'voice',
    args: new Map([
        ['用戶', { required: true, description: '想要錄哪個用戶', type: 'member' }],
        ['文件名稱', { required: false, description: '錄音後的文件名稱', type: 'string' }]
    ]),
    description: '對語音頻道錄音'
};