import type { Client, Message, ChatInputCommandInteraction, GuildMember } from "discord.js";
import { type VoiceConnection, getVoiceConnection } from "@discordjs/voice";
import { memberGet, reply } from '../modules/functions';
import { exportRecordAsZip, exportRecord, allRecord } from "../modules/recordBuffer";
import type { configCommandType } from "..";

export const run = async(client: Client, message: Message | ChatInputCommandInteraction, args: string[]) => {
    if(!message.guildId || !client.user) return;
    const member: GuildMember | undefined = memberGet(message, args[1]);
    const connection: VoiceConnection | undefined = getVoiceConnection(message.guildId, client.user.id);
    if(!connection) return reply(message, { content: '機器人尚未加入語音頻道' });
    if(allRecord.size === 0) return reply(message, { content: '机器人并未开始录音' });
    if(member && !allRecord.has(member.id)) return reply(message, { content: '机器人并未对于该用户录音' });
    const stopRecordId: string[] = member ? [member.id] : Array.from(allRecord.keys());
    args[0]?.toString().toLowerCase() === 'false' ? exportRecord(stopRecordId) : await exportRecordAsZip(stopRecordId);
    stopRecordId.forEach(id => {
        allRecord.get(id)?.listenStream.destroy();
        allRecord.delete(id);
    });
    reply(message, { content: '機器人已停止錄音并导出文件' });
};

export const conf: configCommandType = {
    name: 'stop',
    permLevel: 'Owner',
    aliases: [],
    category: 'voice',
    args: new Map([
        ['是否壓縮成zip檔案', { required: false, description: '是寫true 否寫false', type: 'boolean' }],
        ['用戶', { required: false, description: '想要停止錄音的用戶 不填則則是停止所有錄音', type: 'user' }],
    ]),
    description: '停止對成員進行錄音'
};