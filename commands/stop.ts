import { type Client, Message, type ChatInputCommandInteraction, type GuildMember } from "discord.js";
import { type VoiceConnection, getVoiceConnection } from "@discordjs/voice";
import { reply } from '../modules/functions';
import { exportRecordAsZip, exportRecord, allRecord } from "../modules/recordbuffer";
import { type configCommandType } from "..";

export const run = (client: Client, message: Message | ChatInputCommandInteraction, args: string[]) => {
    if(!message.guildId || !client.user) return;
    const exportAsSingleFile: boolean = args[0]?.toLowerCase() === 'false';
    const user: GuildMember | undefined = message instanceof Message ? message.mentions.members?.first() || message.guild?.members.cache.get(args[1]) : message.guild?.members.cache.get(args[1]);
    if(!allRecord) return reply(message, { content: '機器人並未錄音' });
    const connection: VoiceConnection | undefined = getVoiceConnection(message.guildId, client.user.id);
    if(!connection) return reply(message, { content: '機器人尚未加入語音頻道' });
    if(user && !allRecord.has(user.id)) return reply(message, { content: '机器人并未对于该用户录音' });
    const stopRecordId: string[] = user ? [user.id] : [...allRecord.keys()];
    exportAsSingleFile ? exportRecord(...stopRecordId) : exportRecordAsZip(...stopRecordId);
    reply(message, { content: '機器人正在停止錄音' });
}

export const conf: configCommandType = {
    name: 'stop',
    permLevel: 'Owner',
    aliases: [],
    category: 'voice',
    args: new Map([
        ['是否壓縮成zip檔案', { required: false, description: '是隨便寫 否寫false', type: 'string' }],
        ['用戶', { required: false, description: '想要停止錄音的用戶 不填則則是停止所有錄音', type: 'user' }],
    ]),
    description: '停止對語音頻道進行錄音'
};