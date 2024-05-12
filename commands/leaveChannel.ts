interface conf { name: string; permLevel: string; aliases: string[], category: string, args: Map<string, { required: boolean, description: string, type: string }>, description: string };

import { type Client, type Message, type ChatInputCommandInteraction } from "discord.js";
import { type VoiceConnection, getVoiceConnection } from '@discordjs/voice';
import { reply } from "../modules/functions";

export const run = (client: Client, message: Message | ChatInputCommandInteraction, args: string[]) => {
    if(!message.guildId || !client.user) return;
    const connection: VoiceConnection | undefined = getVoiceConnection(message.guildId, client.user.id);
    if(!connection) return reply(message, { content: '機器人根本沒有加入語音頻道' });
    connection.destroy();
    reply(message, { content: '成功離開頻道' });
};

export const conf: conf = {
    name: 'leave',
    permLevel: 'User',
    aliases: ['leavechannel', 'leavevoicechannel'],
    args: new Map(),
    category: 'voice',
    description: '讓機器人離開當前所加入的語音頻道'
};