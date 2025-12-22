import type { Client, Message, ChatInputCommandInteraction } from "discord.js";
import { type VoiceConnection, getVoiceConnection } from '@discordjs/voice';
import { reply } from "../modules/functions";
import type { configCommandType } from "..";
import { allRecord, exportRecord } from "../modules/recordBuffer";
import config from "../config";

export const run = (client: Client, message: Message | ChatInputCommandInteraction, args: string[]) => {
    if(!message.guildId) return;
    const connection: VoiceConnection | undefined = getVoiceConnection(message.guildId, config.settings.clientId);
    if(!connection) return reply(message, { content: '機器人根本沒有加入語音頻道' });
    if(allRecord.size !== 0) {
        const forceLeave = args[0].toLowerCase() === 'true';
        if(!forceLeave) return reply(message, { content: '机器人还在录音' });
        const stopRecordId = Array.from(allRecord.keys());
        exportRecord(stopRecordId);
        stopRecordId.forEach(id => {
            allRecord.get(id)?.listenStream.push(null);
            allRecord.delete(id);
        });
    }
    reply(message, { content: connection.disconnect() ? '成功離開頻道': '离开频道失败' });
};

export const conf: configCommandType = {
    name: 'leave',
    permLevel: 'User',
    aliases: ['leavechannel', 'leavevoicechannel'],
    args: new Map([
        ['强制离开', { required: false, description: '即使在录音当中也让机器人强制离开', type: 'boolean' }]
    ]),
    category: 'voice',
    description: '讓機器人離開當前所加入的語音頻道'
};