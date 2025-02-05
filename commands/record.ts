import { type Client, Message, type ChatInputCommandInteraction, type GuildMember, type User } from "discord.js";
import { type VoiceConnection, type AudioReceiveStream, getVoiceConnection } from "@discordjs/voice";
import { OpusEncoder } from "@discordjs/opus";
import moment from "moment-timezone";
import path from 'path';
import config from '../config';
import { reply } from "../modules/functions";
import { addWriteStream, writeFileStream } from "../modules/writeStream";
import { type configCommandType } from '..';

export const run = (client: Client, message: Message | ChatInputCommandInteraction, args: string[]) => {
    if(!message.guildId || !client.user) return;
    const user: GuildMember | User | undefined = message instanceof Message ? message.mentions.members?.first() || message.guild?.members.cache.get(args[0]) : message.guild?.members.cache.get(args[0]);
    if(!user) return reply(message, { content: '請指定一個用戶' });
    const fileName: string = args[2] || `${moment().tz('Asia/Taipei').format('YYYY-MM-DD_HH:mm:ss')}.pcm`;
    const connection: VoiceConnection | undefined = getVoiceConnection(message.guildId, client.user.id);
    if(!connection) return reply(message, { content: '機器人尚未加入語音頻道' });
    const encoder: OpusEncoder = new OpusEncoder(48000, 2);
    const subsription: AudioReceiveStream = connection.receiver.subscribe(user.id);
    addWriteStream(path.join(config.settings.audioOutputDicPath, fileName), user.id);
    subsription.on('data', chunk => writeFileStream(user.id, encoder.decode(chunk)));
    return reply(message, { content: '正在錄音' });
}

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