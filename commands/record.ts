import { type Client, Message, type ChatInputCommandInteraction, type GuildMember } from "discord.js";
import { type VoiceConnection, type AudioReceiveStream, getVoiceConnection } from "@discordjs/voice";
import { OpusEncoder } from "@discordjs/opus";
import moment from "moment-timezone";
import path from 'path';
import config from '../config';
import { reply } from "../modules/functions";
import { addWriteStream } from "../modules/writeStream";
import { type configCommandType } from '..';
import { type WriteStream } from "fs";

export const run = (client: Client, message: Message | ChatInputCommandInteraction, args: string[]) => {
    const { timeFormat, timeZone, audioOutputPath } = config.settings;
    if(!message.guildId || !client.user) return;
    const user: GuildMember | undefined = message instanceof Message ? message.mentions.members?.first() || message.guild?.members.cache.get(args[0]) : message.guild?.members.cache.get(args[0]);
    if(!user) return reply(message, { content: '請指定一個用戶' });
    const fileName: string = args[1] || `${moment().tz(timeZone).format(timeFormat)}.pcm`;
    const connection: VoiceConnection | undefined = getVoiceConnection(message.guildId, client.user.id);
    if(!connection) return reply(message, { content: '機器人尚未加入語音頻道' });
    const encoder: OpusEncoder = new OpusEncoder(48000, 2);
    const listenStream: AudioReceiveStream = connection.receiver.subscribe(user.id);
    const writeStream: WriteStream = addWriteStream(path.join(audioOutputPath, fileName), user.id);
    listenStream.on('data', chunk => writeStream.write(encoder.decode(chunk)));
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