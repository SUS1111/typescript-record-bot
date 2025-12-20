import type { Client, Message, ChatInputCommandInteraction, VoiceBasedChannel } from "discord.js";
import { AudioReceiveStream, type VoiceConnection, getVoiceConnection } from "@discordjs/voice";
import path from 'path';
import config from '../config';
import { memberGet, reply } from "../modules/functions";
import { addRecord, allRecord } from "../modules/recordBuffer";
import type { configCommandType } from "..";
import { OpusEncoder } from "@discordjs/opus";
import moment from "moment-timezone";
import { type WriteStream, createWriteStream } from "fs";

export const run = (client: Client, message: Message | ChatInputCommandInteraction) => {
    const { outputTimeFormat, audioOutputPath, timeZone } = config.settings;
    if(!message.guild || !message.member) return;
    const connection: VoiceConnection | undefined = getVoiceConnection(message.guild.id, config.settings.clientId);
    const voiceChannel: VoiceBasedChannel | undefined | null = memberGet(message, message.member.user.id)?.voice.channel;
    if(!connection || !voiceChannel) return reply(message, { content: '機器人尚未加入語音頻道' });
    const encoder: OpusEncoder = new OpusEncoder(48000, 2);
    voiceChannel.members.forEach(member => {
        const memberId = member.id;
        if(allRecord.has(memberId)) return;
        const fileName: string = `${moment().tz(timeZone).format(outputTimeFormat)}-${memberId}.pcm`;
        const filePath = path.join(audioOutputPath, fileName);
        const listenStream: AudioReceiveStream = connection.receiver.subscribe(memberId);
        const recordData: WriteStream = addRecord(memberId, filePath, listenStream, Date.now(), createWriteStream(filePath));
        listenStream.on('data', chunk => recordData.write(encoder.decode(chunk)));
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