import type { Client, Message, ChatInputCommandInteraction, GuildMember } from "discord.js";
import { memberGet, permlevel, reply } from "../modules/functions";
import type { configCommandType, permLevel } from "..";
import config from "../config";

export const run = (client: Client<true>, message: Message<true> | ChatInputCommandInteraction<'cached'>, args: any[]) => {
    const member: GuildMember | undefined | null = memberGet(message, args[0]) || message.member;
    const { permLevels } = config;
    if(!member) return;
    const permlevelGet: number = permlevel(member);
    return reply(message, { content: `${member.user.username}的权限是: ${permlevelGet} (${permLevels.find((l: permLevel) => l.level === permlevelGet)?.name})`});
};

export const conf: configCommandType = {
    name: 'permission',
    permLevel: 'User',
    aliases: ['perm'],
    category: 'system',
    args: new Map([
        ['用户', { required: false, description: '想要查看权限的用户', type: 'user' }]
    ]),
    description: '回傳機器人延遲'
};