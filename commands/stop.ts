import { Client, Message, ChatInputCommandInteraction, GuildMember, User } from "discord.js";
import { VoiceConnection, getVoiceConnection } from "@discordjs/voice";
import { getWriteStream, reply, writeFileStream } from "../modules/functions";

interface conf { name: string; permLevel: string; aliases: string[], category: string, args: Map<string, { required: boolean, description: string, type: string }>, description: string };

export const run = (client: Client, message: Message | ChatInputCommandInteraction, args: string[]) => {
    if(!message.guildId || !client.user) return;
    const connection: VoiceConnection | undefined = getVoiceConnection(message.guildId, client.user.id);
    if(!connection) return reply(message, { content: '機器人尚未加入語音頻道' });
    const recordingFilePath: string | Buffer = getWriteStream().path;
    if(!recordingFilePath || recordingFilePath instanceof Buffer) return reply(message, { content: '機器人並未錄音' });
    writeFileStream(recordingFilePath, true);
    reply(message, { content: '機器人已停止錄音' });
}

export const conf: conf = {
    name: 'stop',
    permLevel: 'Owner',
    aliases: [],
    category: 'voice',
    args: new Map(),
    description: '停止對語音頻道進行錄音'
};