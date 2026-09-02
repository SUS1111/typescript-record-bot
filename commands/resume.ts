import { getMemberId, reply } from "../modules/functions";
import { getUserRecording, hasRecordings, mappedRecordings, type UserRecord } from "../modules/recordings";
import { getVoiceConnection } from "@discordjs/voice";
import type { cmd } from "..";
import logger from "../modules/logger";

const resumeRecordFunction = (userRecording: UserRecord) => userRecording.resumeRecord().then(() => null).catch(e => {
    logger.error(e);
    if (e instanceof Error) return e.message;
});

export const run: cmd['run'] = async(message, args) => {
    if(!hasRecordings()) return reply(message, { content: '機器人尚未開始錄音' });

    const connection = getVoiceConnection(message.guildId);
    if(!connection) return reply(message, { content: '機器人尚未加入語音頻道' });

    const memberId = getMemberId(args[0]);
    const userRecording = getUserRecording(memberId ?? '');
    if(memberId && !userRecording) return reply(message, { content: '机器人并未对该用户录音' });

    const result = userRecording ? [await resumeRecordFunction(userRecording)] : await Promise.all(mappedRecordings(resumeRecordFunction));
    return reply(message, { content: result.some(value => value === null) ? '已继续录音' : (result.filter(value => typeof value === 'string')[0] ?? '出现了些错误' )});
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