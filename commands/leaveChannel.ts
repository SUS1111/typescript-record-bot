import type { Client, Message, ChatInputCommandInteraction } from "discord.js";
import { type VoiceConnection, getVoiceConnection } from '@discordjs/voice';
import { reply } from "../modules/functions";
import type { configCommandType } from "..";

export const run = (client: Client, message: Message | ChatInputCommandInteraction) => {
    if(!message.guildId || !client.user) return;
    const connection: VoiceConnection | undefined = getVoiceConnection(message.guildId, client.user.id);
    if(!connection) return reply(message, { content: '機器人根本沒有加入語音頻道' });
    connection.destroy();
    reply(message, { content: '成功離開頻道' });
};

export const conf: configCommandType = {
    name: 'leave',
    permLevel: 'User',
    aliases: ['leavechannel', 'leavevoicechannel'],
    args: new Map(),
    category: 'voice',
    description: '讓機器人離開當前所加入的語音頻道'
};