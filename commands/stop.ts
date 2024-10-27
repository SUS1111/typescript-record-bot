import { type Client, Message, type ChatInputCommandInteraction, type GuildMember, type User } from "discord.js";
import { type VoiceConnection, getVoiceConnection } from "@discordjs/voice";
import { reply } from '../modules/functions';
import { fileToZip, getAllWriteStream, stopwriteStream } from "../modules/writeStream";
import { type WriteStream } from 'fs';

interface conf { name: string; permLevel: string; aliases: string[], category: string, args: Map<string, { required: boolean, description: string, type: string }>, description: string };

export const run = (client: Client, message: Message | ChatInputCommandInteraction, args: string[]) => {
    if(!message.guildId || !client.user) return;
    const compressToZip: boolean = args[0]?.toLowerCase() !== 'false';
    const user: GuildMember | User | undefined = message instanceof Message ? message.mentions.members?.first() || message.guild?.members.cache.get(args[1]) : message.guild?.members.cache.get(args[1]);
    const recordingFilePaths: Map<string, WriteStream> = getAllWriteStream();
    if(!recordingFilePaths) return reply(message, { content: '並沒有該錄音' });
    const connection: VoiceConnection | undefined = getVoiceConnection(message.guildId, client.user.id);
    if(!connection) return reply(message, { content: '機器人尚未加入語音頻道' });
    if(!recordingFilePaths || recordingFilePaths instanceof Buffer) return reply(message, { content: '機器人並未錄音' });
    user?.id ? stopwriteStream(user.id) : recordingFilePaths.forEach((file: WriteStream, id: string) => stopwriteStream(id));
    const filePaths: string[] = [...recordingFilePaths.values()].map((WriteStream: WriteStream) => WriteStream.path.toString());
    if(compressToZip) fileToZip(...filePaths);
    reply(message, { content: '機器人正在停止錄音' });
}

export const conf: conf = {
    name: 'stop',
    permLevel: 'Owner',
    aliases: [],
    category: 'voice',
    args: new Map([
        ['是否壓縮成zip檔案', { required: false, description: '是隨便寫 否寫false', type: 'string' }],
        ['用戶', { required: false, description: '想要停止錄音的用戶 不填則則是停止所有錄音', type: 'user' }]
    ]),
    description: '停止對語音頻道進行錄音'
};