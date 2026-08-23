import { memberGet, reply } from "../modules/functions";
import { recordings, type UserRecord } from "../modules/recordings";
import { getVoiceConnection } from "@discordjs/voice";
import type { cmd } from "..";
import logger from "../modules/logger";

const resumeRecordFunction = (userRecording: UserRecord) => {
    try {
        userRecording.resumeRecord();
        return null;
    } catch (e: unknown) {
        logger.error(e);
        if(e instanceof Error) return e.message;
    }
}

export const run: cmd['run'] = (client, message, args) => {
    if(recordings.size === 0) return reply(message, { content: '機器人尚未開始錄音' });

    const connection = getVoiceConnection(message.guildId, client.user.id);
    if(!connection) return reply(message, { content: '機器人尚未加入語音頻道' });

    const member = memberGet(message, args[0]);
    const userRecording = recordings.get(member?.id ?? '');
    if(member && !userRecording) return reply(message, { content: '机器人并未对该用户录音' });

    const result = Array.from(userRecording ? [userRecording] : recordings.values(), resumeRecordFunction);
    return result.every(value => value === null) ? reply(message, { content: '已暫停錄音' }) : reply(message, { content: result.filter(value => value !== null)[0] });
}

export const conf: cmd['conf'] = {
    name: 'resume',
    permLevel: 'Owner',
    aliases: [],
    category: 'voice',
    args: new Map([
        ['用戶', { required: false, description: '想要繼續錄音的用戶 不填則是繼續所有錄音', type: 'user' }],
    ]),
    description: '繼續錄音'
};