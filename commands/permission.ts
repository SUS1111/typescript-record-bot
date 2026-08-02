import { memberGet, permlevel, reply } from "../modules/functions";
import type { cmd } from "..";
import config from "../config";

export const run: cmd['run'] = (client, message, args) => {
    const member = memberGet(message, args[0]) || message.member;
    const { permLevels } = config;
    if(!member) return;
    const permlevelGet: number = permlevel(member);
    return reply(message, { content: `${member.user.username}的權限是: ${permlevelGet} (${permLevels.find((l: config['permLevels'][0]) => l.level === permlevelGet)?.name})`});
};

export const conf: cmd['conf'] = {
    name: 'permission',
    permLevel: 'User',
    aliases: ['perm'],
    category: 'system',
    args: new Map([
        ['用户', { required: false, description: '想要查看權限的用戶', type: 'user' }]
    ]),
    description: '查看用戶的權限'
};