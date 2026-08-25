export interface cmd {
    run: (message: Message<true> | ChatInputCommandInteraction<'cached'>, args: string[]) => Promise<Message>;
    conf: {
        name: string;
        permLevel: string;
        aliases: string[];
        category: ExtractMapKeys<config['categoryList']>;
        description: string;
        args: Map<string, { required: boolean, description: string, type: slashCommandOptionTypes }>
    }
};
export type slashCommandOptionTypes = 'boolean' | 'channel' | 'integer' | 'mentionable' | 'number' | 'role' | 'string' | 'user';
export type ExtractMapKeys<T> = T extends Map<infer K, any> ? K : never;
export type ExtractMapValue<T> = T extends Map<any, infer V> ? V : never;

import { Client, Partials, Collection, type Message, type ChatInputCommandInteraction } from 'discord.js';
import config from './config';
import logger from './modules/logger';
import { validFileName } from './modules/functions';
import { lstatSync, readdirSync } from 'fs';

const { permLevels, commandPaths, eventPaths, settings } = config;

process.loadEnvFile();

if(!process.env.token) throw new Error('請在.env文件提供令牌!');
if(!lstatSync(settings.audioOutputPath).isDirectory()) throw new Error('並不存在該文件夾');
if(!validFileName(settings.outputTimeFormat)) throw new Error('这种文件名是无效的');

const intents = 53608447; // all intents
const partials = [Partials.Channel, Partials.User, Partials.GuildMember, Partials.Message, Partials.Reaction, Partials.GuildScheduledEvent, Partials.ThreadMember];
const client: Client<true> = new Client({ intents, partials });

const commands: Collection<string, cmd> = new Collection();
const aliases: Collection<string, string> = new Collection();

const levelCache: { [key: string]: number } = {};
for (let i = 0; i < permLevels.length; i++) {
    const thisLevel = permLevels[i];
    levelCache[thisLevel.name] = thisLevel.level;
}

export const container = { commands, aliases, levelCache, client };

const loadCommand = () => (settings.autoLoadCommand ? readdirSync('./commands') : commandPaths).forEach(async file => {
    try {
        let cleanFile = file;
        if(!file.startsWith('./commands/')) cleanFile = `./commands/${file}`;
        const code: cmd = await import(cleanFile);
        container.commands.set(code.conf.name, code);
        code.conf.aliases.forEach((alias: string) => container.aliases.set(alias, code.conf.name));
        logger.log(`CMD ${code.conf.name} 已被載入 ✅`);
    } catch (e: unknown) {
       logger.error(e);
    }
});

loadCommand();

eventPaths.forEach(async (path, name) => {
    try {
        const { default: code } = await import(path);
        client.on(name, code);
        logger.log(`EVENT ${name} 已被載入 ✅`);
    } catch (e: unknown) {
        logger.error(e);
    }
});

client.login(process.env.token);