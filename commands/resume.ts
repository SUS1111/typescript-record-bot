import type { Client, Message, ChatInputCommandInteraction } from "discord.js";
import { memberGet, reply } from "../modules/functions";
import { allRecord, magicNumber } from "../modules/recordBuffer";
import { getVoiceConnection } from "@discordjs/voice";
import config from "../config";
import type { configCommandType } from "..";

export const run = (client: Client<true>, message: Message<true> | ChatInputCommandInteraction<'cached'>, args: string[]) => {
    if(allRecord.size === 0) return reply(message, { content: '机器人并未开始录音' });
    const member = memberGet(message, args[0]);
    const connection = getVoiceConnection(message.guildId, config.settings.clientId);
    if(!connection) return reply(message, { content: '機器人尚未加入語音頻道' });
    if(args[0]) {
        if(!member) return reply(message, { content: '该成员并不存在' });
        if(!allRecord.has(member.id)) return reply(message, { content: '机器人并未对该成员录音' });
        if(!allRecord.get(member.id)?.listenStream.isPaused()) return reply(message, { content: '机器人正在对该成员录音' });
    }
    const resumeRecordId = member ? [member.id] : Array.from(allRecord.keys());
    resumeRecordId.forEach(id => {
        const userRecording = allRecord.get(id)!;
        const silenceTime = Date.now() - userRecording.lastSilence!;
        userRecording.writeStream.write(Buffer.alloc(silenceTime * magicNumber));
        userRecording.listenStream.resume();
        userRecording.lastSilence = Date.now();
    });
    return reply(message, { content: '已经继续了对该成员的录音' });
}

export const conf: configCommandType = {
    name: 'resume',
    permLevel: 'Owner',
    aliases: [],
    category: 'voice',
    args: new Map([
        ['用戶', { required: false, description: '想要继续錄音的用戶 不填則則是继续所有錄音', type: 'user' }],
    ]),
    description: '继续對成員進行錄音'
};