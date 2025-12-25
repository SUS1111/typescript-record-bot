import type { Client, Message, ChatInputCommandInteraction } from "discord.js";
import { memberGet, reply } from "../modules/functions";
import { allRecord } from "../modules/recordBuffer";
import { getVoiceConnection } from "@discordjs/voice";
import config from "../config";
import type { configCommandType } from "..";

export const run = (client: Client<true>, message: Message<true> | ChatInputCommandInteraction<'cached'>, args: string[]) => {
    if(allRecord.size === 0) return reply(message, { content: '機器人尚未開始錄音' });
    const member = memberGet(message, args[0]);
    const connection = getVoiceConnection(message.guildId, config.settings.clientId);
    if(!connection) return reply(message, { content: '機器人尚未加入語音頻道' });
    if(args[0]) {
        if(!member) return reply(message, { content: '該成員並不存在' });
        if(!allRecord.has(member.id)) return reply(message, { content: '機器人尚未對該成員錄音' });
        if(allRecord.get(member.id)?.listenStream.isPaused()) return reply(message, { content: '機器人已經暫停了對該成員的錄音' });
    }
    const pauseRecordId = member ? [member.id] : Array.from(allRecord.keys());
    pauseRecordId.forEach(id => {
        const userRecording = allRecord.get(id)!;
        userRecording.listenStream.pause();
        allRecord.set(id, { ...allRecord.get(id)!, lastSilence: Math.min(Date.now(), userRecording.lastSilence ?? Number.MAX_SAFE_INTEGER) });
    });
    return reply(message, { content: '已經暫停了對該成員的錄音' });
}

export const conf: configCommandType = {
    name: 'pause',
    permLevel: 'Owner',
    aliases: [],
    category: 'voice',
    args: new Map([
        ['用戶', { required: false, description: '想要暫停的用戶 不填則是暫停所有錄音', type: 'user' }],
    ]),
    description: '暂停錄音'
};