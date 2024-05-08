interface conf { name: string; permLevel: string; aliases: string[], category: string, args: Map<string, { required: boolean, description: string, type: string }>, description: string };

import { Client, Message, ChatInputCommandInteraction, } from "discord.js";
import { VoiceConnection, getVoiceConnection } from '@discordjs/voice';

export const run = (client: Client, message: Message | ChatInputCommandInteraction, args: string[]) => {
    if(!message.guildId) return { content: '請在伺服器進行此操作' };
    const connection: VoiceConnection | undefined = getVoiceConnection(message.guildId);
    if(!connection) return { content: '機器人根本沒有加入語音頻道' };
    connection.destroy();
    return { content: '成功離開頻道' };
};

export const conf: conf = {
    name: 'leave',
    permLevel: 'User',
    aliases: ['leavechannel', 'leavevoicechannel'],
    args: new Map(),
    category: 'voice',
    description: '讓機器人離開當前所加入的語音頻道'
};