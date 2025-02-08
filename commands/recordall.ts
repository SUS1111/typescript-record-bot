import { type Client, type Message, type ChatInputCommandInteraction, type VoiceBasedChannel } from "discord.js";
import { AudioReceiveStream, type VoiceConnection, getVoiceConnection } from "@discordjs/voice";
import path from 'path';
import config from '../config';
import { reply } from "../modules/functions";
import { addRecord } from "../modules/recordbuffer";
import moment from "moment";
import { type configCommandType } from "..";
import { OpusEncoder } from "@discordjs/opus";

export const run = (client: Client, message: Message | ChatInputCommandInteraction, args: string[]) => {
    const { timeFormat, timeZone, audioOutputPath } = config.settings;
    if(!message.guildId || !client.user || !message.guild || !message.member) return;
    const connection: VoiceConnection | undefined = getVoiceConnection(message.guildId, client.user.id);
    const voiceChannel: VoiceBasedChannel | undefined | null = message.guild.members.cache.get(message.member?.user.id)?.voice.channel;
    if(!connection || !voiceChannel) return reply(message, { content: '機器人尚未加入語音頻道' });
    const encoder: OpusEncoder = new OpusEncoder(48000, 2);
    let i: number = 1;
    const recordMember = voiceChannel.members;
    recordMember.forEach(member => {
        const memberId = member.id;
        const fileName: string = `${moment().tz(timeZone).format(timeFormat)}-${i}.pcm`;
        const listenStream: AudioReceiveStream = connection.receiver.subscribe(memberId);
        const writeStream: Buffer[] = addRecord(path.join(audioOutputPath, fileName), memberId);
        listenStream.on('data', chunk => writeStream.push(encoder.decode(chunk)));
        i++;
    });
    return reply(message, { content: '已開始錄音' });
};

export const conf: configCommandType = {
    name: 'recordall',
    permLevel: 'User',
    aliases: [],
    category: 'voice',
    args: new Map(),
    description: '對語音頻道錄音'
};