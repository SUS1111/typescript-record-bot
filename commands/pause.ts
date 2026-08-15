import { memberGet, reply } from "../modules/functions";
import { allRecord } from "../modules/recordBuffer";
import { getVoiceConnection } from "@discordjs/voice";
import config from "../config";
import type { cmd } from "..";

export const run: cmd['run'] = (client, message, args) => {
    if(allRecord.size === 0) return reply(message, { content: '機器人尚未開始錄音' });
    const member = memberGet(message, args[0]);
    const connection = getVoiceConnection(message.guildId, config.settings.clientId);
    if(!connection) return reply(message, { content: '機器人尚未加入語音頻道' });
    if(args[0]) {
        if(!member) return reply(message, { content: '該成員並不存在' });
        const memberRecord = allRecord.get(member.id);
        if(!memberRecord) return reply(message, { content: '機器人尚未對該成員錄音' });
        if(memberRecord.listenStream.isPaused()) return reply(message, { content: '機器人已經暫停了對該成員的錄音' });
    }
    const pauseRecordId = member ? [member.id] : Array.from(allRecord.keys());
    pauseRecordId.forEach(id => {
        const userRecording = allRecord.get(id)!;
        userRecording.listenStream.pause();
        allRecord.set(id, { ...allRecord.get(id)!, lastSilence: Math.min(Date.now(), userRecording.lastSilence ?? Number.MAX_SAFE_INTEGER) });
    });
    return reply(message, { content: '已經暫停了對該成員的錄音' });
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