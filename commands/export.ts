import type { Client, Message, ChatInputCommandInteraction, GuildMember } from "discord.js";
import { type VoiceConnection, getVoiceConnection } from "@discordjs/voice";
import { memberGet, reply } from '../modules/functions';
import { allRecord, exportRecordAsZip } from "../modules/recordBuffer";
import { type configCommandType } from "..";

export const run = (client: Client, message: Message | ChatInputCommandInteraction, args: string[]) => {
    if(!message.guildId || !client.user) return;
    const user: GuildMember | undefined = memberGet(message, args[0]);
    const connection: VoiceConnection | undefined = getVoiceConnection(message.guildId, client.user.id);
    if(!connection) return reply(message, { content: '機器人尚未加入語音頻道' });
    if(allRecord.size === 0) return reply(message, { content: '机器人并未开始录音' });
    if(user && !allRecord.has(user.id)) return reply(message, { content: '机器人并未对于该用户录音' });
    const stopRecordId: string[] = user ? [user.id] : Array.from(allRecord.keys());
    exportRecordAsZip(stopRecordId).then(() => reply(message, { content: '機器人已汇出錄音' }));
};

export const conf: configCommandType = {
    name: 'export',
    permLevel: 'Owner',
    aliases: [],
    category: 'voice',
    args: new Map([
        ['用戶', { required: false, description: '想要导出錄音的用戶 不填則則是导出所有錄音', type: 'user' }],
    ]),
    description: '停止對語音頻道進行錄音'
};