import type { Client, Message, ChatInputCommandInteraction, VoiceBasedChannel } from "discord.js";
import { AudioReceiveStream, type VoiceConnection, getVoiceConnection } from "@discordjs/voice";
import path from 'path';
import config from '../config';
import { reply } from "../modules/functions";
import { addRecord, allRecord } from "../modules/recordBuffer";
import { container, type configCommandType } from "..";
import { OpusEncoder } from "@discordjs/opus";

export const run = (client: Client, message: Message | ChatInputCommandInteraction) => {
    const { outputTimeFormat, audioOutputPath } = config.settings;
    if(!client.user || !message.guild || !message.member) return;
    const connection: VoiceConnection | undefined = getVoiceConnection(message.guild.id, client.user.id);
    const voiceChannel: VoiceBasedChannel | undefined | null = message.guild.members.cache.get(message.member.user.id)?.voice.channel;
    if(!connection || !voiceChannel) return reply(message, { content: '機器人尚未加入語音頻道' });
    const encoder: OpusEncoder = new OpusEncoder(48000, 2);
    voiceChannel.members.forEach(member => {
        const memberId = member.id;
        if(allRecord.has(memberId)) return;
        const fileName: string = `${container.momentInit.format(outputTimeFormat)}-${memberId}.pcm`;
        const listenStream: AudioReceiveStream = connection.receiver.subscribe(memberId);
        const recordData: Buffer[] = addRecord(memberId, path.join(audioOutputPath, fileName), listenStream);
        listenStream.on('data', chunk => recordData.push(encoder.decode(chunk)));
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