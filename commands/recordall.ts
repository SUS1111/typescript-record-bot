import { getVoiceConnection } from "@discordjs/voice";
import { reply } from "../modules/functions";
import { startChannelRecord } from "../modules/recordings";
import type { cmd } from "..";

export const run: cmd['run'] = (client, message) => {
    const connection = getVoiceConnection(message.guild.id, client.user.id);
    if(!connection) return reply(message, { content: '機器人尚未加入語音頻道' });

    startChannelRecord(connection.receiver);
    return reply(message, { content: '已開始錄音' });
};

export const conf: cmd['conf'] = {
    name: 'recordall',
    permLevel: 'User',
    aliases: ['recordchannel'],
    category: 'voice',
    args: new Map(),
    description: '對語音頻道錄音'
};