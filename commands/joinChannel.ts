interface conf { name: string; permLevel: string; aliases: string[], category: string, args: Map<string, { required: boolean, description: string, type: string }>, description: string };

import { Client, Message, ChatInputCommandInteraction, Channel, GuildChannel, ChannelType } from "discord.js";
import { joinVoiceChannel } from "@discordjs/voice";

export const run = (client: Client, message: Message | ChatInputCommandInteraction, args: string[]) => {
    const channel: Channel | unknown = message instanceof Message ? message.mentions.channels.first() ||  message.guild?.channels.cache.get(args[0]) || message.member?.voice.channel : message.guild?.channels.cache.get(args[0]);
    if(!channel || !(channel instanceof GuildChannel)) return { content: '找不到頻道' };
    if(channel.type !== ChannelType.GuildVoice) return { content: '機器人只能加入語音頻道' };
    if(!message.guildId) return { content: '請在伺服器進行此操作' };
    joinVoiceChannel({ channelId: channel.id, guildId: message.guildId, selfDeaf: false, adapterCreator: channel.guild.voiceAdapterCreator });
    return { content: '成功加入頻道' };
};

export const conf: conf = {
    name: 'join',
    permLevel: 'User',
    aliases: ['joinchannel', 'joinvoicechannel'],
    args: new Map([
        ['頻道', { required: true, description: '想要讓機器人加入的頻道', type: 'channel' }]
    ]),
    category: 'voice',
    description: '讓機器人加入語音頻道'
};