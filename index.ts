interface cmd { run: (client: Client, message: Message, args: string[]) => any, conf: { name: string; permLevel: string; aliases: string[], category: string }};

import { Client, Partials, Collection, Message } from 'discord.js';
import 'dotenv/config';
import config from './config';
import logger from './modules/logger';

const client = new Client({ intents: 131071, partials: [Partials.Channel, Partials.User, Partials.GuildMember, Partials.Message, Partials.Reaction, Partials.GuildScheduledEvent, Partials.ThreadMember] });

const commands = new Collection<string | undefined, cmd>();
const aliases = new Collection<string | undefined, string>();

const { permLevels, commandPaths, eventPaths } = config;
const levelCache:any = {};
for (let i = 0; i < permLevels.length; i++) {
    const thisLevel = permLevels[i];
    levelCache[thisLevel.name] = thisLevel.level;
}

const container =  { commands, aliases, levelCache };
export { container };

commandPaths.forEach(async (file:string) => {
    try {
        const code:any = await import(file);
        const cmdName:string = code.conf.name;
        container.commands.set(cmdName, code);
        code.conf.aliases.forEach((alias:string) => container.aliases.set(alias, cmdName));
        logger(`CMD ${cmdName} 已被載入 ✅`, 'log');
    } catch (e) {
        console.error(e);
    }
});

eventPaths.forEach(async(path, name) => {
    try {
        const { default: code } = await import(path);
        client.on(name, code.bind(null, client));
        logger(`EVENT ${name} 已被載入 ✅`, 'log');
    } catch (e) {
        console.error(e);
    }
});

client.login(process.env.token);