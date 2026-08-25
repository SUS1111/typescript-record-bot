import { getVoiceConnection } from "@discordjs/voice";
import { memberGet, reply } from "../modules/functions";
import { UserRecord, recordings } from "../modules/recordings";
import type { cmd } from '..';
import config from "../config";

export const run: cmd['run'] = (message, args) => {
    const targetMember = memberGet(message, args[0]);
    if(!targetMember) return reply(message, { content: '請指定一個用戶' });

    const connection = getVoiceConnection(message.guild.id);
    if(!connection) return reply(message, { content: '機器人尚未加入語音頻道' });

    const voiceChannel = targetMember.voice.channel;
    if(voiceChannel !== memberGet(message, config.settings.clientId)?.voice.channel) return reply(message, { content: '該用戶並未與機器人處於同一頻道' });
    if(recordings.has(targetMember.id)) return reply(message, { content: '機器人早對該用戶錄音了' });

    recordings.set(targetMember.id, new UserRecord({ userId: targetMember.id, receiver: connection.receiver }));
    return reply(message, { content: '正在錄音' });
};

export const conf: cmd['conf'] = {
    name: 'record',
    permLevel: 'Owner',
    aliases: [],
    category: 'voice',
    args: new Map([
        ['用戶', { required: true, description: '想要錄哪個用戶', type: 'user' }],
    ]),
    description: '對語音頻道錄音'
};