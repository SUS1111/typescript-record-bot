import { type Client, type Message, type ChatInputCommandInteraction, type VoiceBasedChannel } from "discord.js";
import { AudioReceiveStream, type VoiceConnection, getVoiceConnection } from "@discordjs/voice";
import { OpusEncoder } from "@discordjs/opus";
import path from 'path';
import config from '../config';
import { reply } from "../modules/functions";
import { addWriteStream, getWriteStream, writeFileStream } from "../modules/writeStream";
import moment from "moment";

interface conf { name: string; permLevel: string; aliases: string[], category: string, args: Map<string, { required: boolean, description: string, type: string }>, description: string };

export const run = (client: Client, message: Message | ChatInputCommandInteraction, args: string[]) => {
    if(!message.guildId || !client.user || !message.guild || !message.member) return;
    const connection: VoiceConnection | undefined = getVoiceConnection(message.guildId, client.user.id);
    const voiceChannel: VoiceBasedChannel | undefined | null = message.guild.members.cache.get(message.member?.user.id)?.voice.channel;
    if(!connection || !voiceChannel) return reply(message, { content: '機器人尚未加入語音頻道' });
    const encoder: OpusEncoder = new OpusEncoder(48000, 2);
    let i: number = 1;
    const listener = (userId: string): void => {
        if(getWriteStream(userId)) return;
        const fileName: string = `${moment().tz('Asia/Taipei').format('YYYY-MM-DD_HH:mm:ss')}-${i}.pcm`;
        addWriteStream(path.join(config.settings.audioOutputDicPath, fileName), userId);
        const subsription: AudioReceiveStream = connection.receiver.subscribe(userId);
        subsription.on('data', chunk => writeFileStream(userId, encoder.decode(chunk)));
        i++;
    };
    connection.receiver.speaking.on('start', listener);
    return reply(message, { content: '已開始錄音' });
};

export const conf: conf = {
    name: 'recordall',
    permLevel: 'User',
    aliases: [],
    category: 'voice',
    args: new Map(),
    description: '對語音頻道錄音'
};