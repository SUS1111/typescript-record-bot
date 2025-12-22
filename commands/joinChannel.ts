import { type Client, type Message, type ChatInputCommandInteraction, type GuildBasedChannel, ChannelType } from "discord.js";
import { getVoiceConnection, joinVoiceChannel } from "@discordjs/voice";
import { channelGet, memberGet, reply } from "../modules/functions";
import { type configCommandType } from '..';
import config from "../config";
import { allRecord, exportRecord } from "../modules/recordBuffer";

export const run = (client: Client, message: Message | ChatInputCommandInteraction, args: string[]) => {
    if(!message.member || !message.guild) return;
    const channel: GuildBasedChannel | undefined | null = channelGet(message, args[0]) || memberGet(message, message.member.user.id)?.voice.channel;
    if(!channel) return reply(message, { content: '找不到頻道' });
    if(channel.type !== ChannelType.GuildVoice && channel.type !== ChannelType.GuildStageVoice) return reply(message, { content: '機器人只能加入語音頻道' });
    if(getVoiceConnection(message.guild.id, config.settings.clientId)) return reply(message, { content: '机器人已经在指定的频道了' });
    if(allRecord.size !== 0) {
        const forceJoin = args[1].toLowerCase() === 'true';
        if(!forceJoin) return reply(message, { content: '机器人还在录音' });
        const stopRecordId = Array.from(allRecord.keys());
        exportRecord(stopRecordId);
        stopRecordId.forEach(id => {
            allRecord.get(id)?.listenStream.push(null);
            allRecord.delete(id);
        });
    }
    joinVoiceChannel({
        channelId: channel.id,
        guildId: message.guild.id,
        selfDeaf: false,
        adapterCreator: channel.guild.voiceAdapterCreator,
        group: config.settings.clientId
    });
    reply(message, { content: '成功加入頻道' });
};

export const conf: configCommandType = {
    name: 'join',
    permLevel: 'User',
    aliases: ['joinchannel', 'joinvoicechannel'],
    args: new Map([
        ['頻道', { required: false, description: '想要讓機器人加入的頻道', type: 'channel' }],
        ['强制加入', { required: false, description: '即使在录音当中也让机器人强制切换频道', type: 'boolean' }]
    ]),
    category: 'voice',
    description: '讓機器人加入語音頻道'
};