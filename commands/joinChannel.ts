import { ChannelType } from "discord.js";
import { entersState, getVoiceConnection, joinVoiceChannel, VoiceConnectionStatus } from "@discordjs/voice";
import { channelGet, memberGet, reply } from "../modules/functions";
import type { cmd } from '..';
import { clearAllRecording, exportAllRecording, hasRecordings, stopAllRecording } from "../modules/recordings";
import config from "../config";

export const run: cmd['run'] = async (message, args) => {
    const channel = channelGet(message, args[0]) || message.member?.voice.channel;
    if(!channel) return reply(message, { content: '找不到頻道' });
    if(channel.type !== ChannelType.GuildVoice && channel.type !== ChannelType.GuildStageVoice) return reply(message, { content: '機器人只能加入語音頻道' });

    const originalConnection = getVoiceConnection(message.guild.id);
    if(originalConnection && memberGet(message, config.settings.clientId)?.voice.channel === channel) return reply(message, { content: '機器人已經在指定的頻道了' });

    if(hasRecordings()) {
        const forceJoin = args[1]?.toLowerCase() === 'true';
        if(!forceJoin) return reply(message, { content: '機器人還在錄音' });
        if (originalConnection) await stopAllRecording(originalConnection.receiver).then(() => exportAllRecording(true)).then(clearAllRecording);
    }

    const newConnection = joinVoiceChannel({
        channelId: channel.id,
        guildId: message.guild.id,
        selfDeaf: false,
        adapterCreator: channel.guild.voiceAdapterCreator,
    });
    return entersState(newConnection, VoiceConnectionStatus.Ready, 5_000)
        .then(() => reply(message, { content: '成功加入頻道' }))
        .catch(() => reply(message, { content: '機器人無法在指定的時間内加入頻道' }));
};

export const conf: cmd['conf'] = {
    name: 'join',
    permLevel: 'User',
    aliases: ['joinchannel', 'joinvoicechannel'],
    args: new Map([
        ['頻道', { required: false, description: '想要讓機器人加入的頻道', type: 'channel' }],
        ['强制加入', { required: false, description: '即使在錄音當中也讓機器人加入頻道', type: 'boolean' }]
    ]),
    category: 'voice',
    description: '讓機器人加入語音頻道'
};