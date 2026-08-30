import { getVoiceConnection } from '@discordjs/voice';
import { reply } from "../modules/functions";
import type { cmd } from "..";
import { hasRecordings, stopAllRecording } from "../modules/recordings";

export const run: cmd['run'] = (message, args) => {
    const connection = getVoiceConnection(message.guildId);
    if(!connection) return reply(message, { content: '機器人根本沒有加入語音頻道' });

    const forceLeave = args[0]?.toLowerCase() === 'true';
    if(hasRecordings() && !forceLeave) return reply(message, { content: '機器人還在錄音' });

    stopAllRecording(connection.receiver);
    return reply(message, { content: connection.disconnect() ? '成功離開頻道': '離開頻道失敗' });
};

export const conf: cmd['conf'] = {
    name: 'leave',
    permLevel: 'User',
    aliases: ['leavechannel', 'leavevoicechannel'],
    args: new Map([
        ['强制離開', { required: false, description: '即使在錄音當中也讓機器人離開頻道', type: 'boolean' }]
    ]),
    category: 'voice',
    description: '讓機器人離開當前所加入的語音頻道'
};