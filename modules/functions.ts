interface permLevels { level: number, name: string, check: (member: any) => boolean }[]

import Discord, { Client, GuildMember, Message, User } from 'discord.js';
import config from '../config';

const permlevel = (member: GuildMember| null) => {
    let permlvl:number = 0;
    const permOrder:permLevels[] = config.permLevels.slice(0).sort((p, c) => (p.level < c.level ? 1 : -1));
    while (permOrder.length) {
        const currentLevel = permOrder.shift();
        if (currentLevel?.check(member)) {
            permlvl = currentLevel.level;
            break;
        }
    }
    return permlvl;
};

const targetGet = (message: Message, args: any[]) => {
    if (!args[0]) return undefined;
    if (args[0].matchAll(Discord.MessageMentions.UsersPattern).next().value) {
        return message.guild?.members.cache.get(args[0].matchAll(Discord.MessageMentions.UsersPattern).next().value[1]);
    }
    return message.guild?.members.cache.get(args[0]);
};

const clean = async (client: Client, text: string) => {
    let value = text;
    if (value && value.constructor.name === 'Promise') { value = await value; }
    if (typeof value !== 'string') { value = require('util').inspect(value, { depth: 1 }); }

    value = value
        .replace(/`/g, `\`${String.fromCharCode(8203)}`)
        .replace(/@/g, `@${String.fromCharCode(8203)}`);

    value = typeof client.token === 'string' ?  value.replace(new RegExp(client.token, 'g'), '[REDACTED]') : value;

    return value;
};

export { permlevel, targetGet, clean };