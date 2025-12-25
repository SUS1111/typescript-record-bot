import type { Client, Message, ChatInputCommandInteraction, VoiceBasedChannel } from "discord.js";
import { type VoiceConnection, getVoiceConnection } from "@discordjs/voice";
import path from 'path';
import config from '../config';
import { reply } from "../modules/functions";
import { addRecord, allRecord } from "../modules/recordBuffer";
import type { configCommandType } from "..";
import moment from "moment-timezone";
import { OpusEncoder } from "@discordjs/opus";

export const run = (client: Client<true>, message: Message<true> | ChatInputCommandInteraction<'cached'>) => {
    const { outputTimeFormat, audioOutputPath, timeZone, sampleRate, channelCount } = config.settings;
    const connection: VoiceConnection | undefined = getVoiceConnection(message.guild.id, config.settings.clientId);
    const voiceChannel: VoiceBasedChannel | undefined | null = message.member?.voice.channel;
    if(!connection || !voiceChannel) return reply(message, { content: '機器人尚未加入語音頻道' });
    voiceChannel.members.forEach(member => {
        const memberId = member.id;
        if(allRecord.has(memberId)) return;
        const fileName: string = `${moment().tz(timeZone).format(outputTimeFormat)}-${memberId}.pcm`;
        const filePath = path.join(audioOutputPath, fileName);
        addRecord(memberId, filePath, connection.receiver, Date.now(), new OpusEncoder(sampleRate, channelCount));
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