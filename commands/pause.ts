import { memberGet, reply } from "../modules/functions";
import { recordings, type UserRecord } from "../modules/recordings";
import { getVoiceConnection } from "@discordjs/voice";
import type { cmd } from "..";
import logger from "../modules/logger";

const pauseRecordFunction = (userRecording: UserRecord) => {
    try {
        userRecording.pauseRecord();
        return null;
    } catch (e: unknown) {
        logger.error(e);
        if(e instanceof Error) return e.message;
    }
}

export const run: cmd['run'] = (message, args) => {
    if(recordings.size === 0) return reply(message, { content: '機器人尚未開始錄音' });
    
    const connection = getVoiceConnection(message.guildId);
    if(!connection) return reply(message, { content: '機器人尚未加入語音頻道' });

    const member = memberGet(message, args[0]);
    const userRecording = recordings.get(member?.id ?? '');
    if(member && !userRecording) return reply(message, { content: '机器人并未对该用户录音' });

    const result = Array.from(userRecording ? [userRecording] : recordings.values(), pauseRecordFunction);
    return result.some(value => value === null) ? reply(message, { content: '已暫停錄音' }) : reply(message, { content: result.filter(value => value !== null)[0] });
}

export const conf: cmd['conf'] = {
    name: 'pause',
    permLevel: 'Owner',
    aliases: [],
    category: 'voice',
    args: new Map([
        ['用戶', { required: false, description: '想要暫停的用戶 不填則是暫停所有錄音', type: 'user' }],
    ]),
    description: '暂停錄音'
};