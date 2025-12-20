import type { Client, Message, ChatInputCommandInteraction, VoiceBasedChannel } from "discord.js";
import { type VoiceConnection, getVoiceConnection } from "@discordjs/voice";
import path from 'path';
import config from '../config';
import { memberGet, reply } from "../modules/functions";
import { addRecord, allRecord } from "../modules/recordBuffer";
import type { configCommandType } from "..";
import moment from "moment-timezone";
import { createWriteStream } from "fs";

export const run = (client: Client, message: Message | ChatInputCommandInteraction) => {
    const { outputTimeFormat, audioOutputPath, timeZone } = config.settings;
    if(!message.guild || !message.member) return;
    const connection: VoiceConnection | undefined = getVoiceConnection(message.guild.id, config.settings.clientId);
    const voiceChannel: VoiceBasedChannel | undefined | null = memberGet(message, message.member.user.id)?.voice.channel;
    if(!connection || !voiceChannel) return reply(message, { content: '機器人尚未加入語音頻道' });
    voiceChannel.members.forEach(member => {
        const memberId = member.id;
        if(allRecord.has(memberId)) return;
        const fileName: string = `${moment().tz(timeZone).format(outputTimeFormat)}-${memberId}.pcm`;
        const filePath = path.join(audioOutputPath, fileName);
        addRecord(memberId, filePath, connection.receiver, Date.now(), createWriteStream(filePath));
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