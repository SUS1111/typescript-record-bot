export interface cmd {
    run: (message: Message<true> | ChatInputCommandInteraction<'cached'>, args: (string | undefined)[]) => Promise<Message>;
    conf: {
        name: string;
        permLevel: typeof permLevels[number]['name'];
        aliases: string[];
        category: ExtractMapKeys<typeof config['categoryList']>;
        description: string;
        args: Map<string, { required: boolean, description: string, type: slashCommandOptionTypes }>
    }
};
export type slashCommandOptionTypes = 'boolean' | 'channel' | 'integer' | 'mentionable' | 'number' | 'role' | 'string' | 'user';
export type ExtractMapKeys<T> = T extends Map<infer K, any> ? K : never;
export type ExtractMapValue<T> = T extends Map<any, infer V> ? V : never;

import { Client, Collection, type Message, type ChatInputCommandInteraction } from 'discord.js';
import config from './config';
import logger from './modules/logger';
import { validFileName } from './modules/functions';
import { lstatSync, readdirSync } from 'fs';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import dayjsTimeZone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import duration from 'dayjs/plugin/duration';

const { permLevels, commandPaths, eventPaths, settings } = config;

process.loadEnvFile();
dayjs.extend(utc);
dayjs.extend(customParseFormat);
dayjs.extend(dayjsTimeZone);
dayjs.extend(duration);

if(!process.env.token) throw new Error('請在.env文件提供令牌!');
if(!lstatSync(settings.audioOutputPath).isDirectory()) throw new Error('並不存在該文件夾');
if(!validFileName(settings.outputTimeFormat)) throw new Error('这种文件名是无效的');
if(!Intl.supportedValuesOf('timeZone').some(timeZone => timeZone === settings.timeZone)) throw new TypeError('这个时区是无效的');

const intents = 53608447; // all intents
const client = new Client({ intents });

const commands = new Collection<string, cmd>();
const aliases = new Collection<string, string>();

const levelCache = Object.fromEntries(permLevels.map(level => [level.name, level.level])) as Record<typeof permLevels[number]['name'], typeof permLevels[number]['level']>;

export const container = { commands, aliases, levelCache, dayjs };

const loadCommand = () => (settings.autoLoadCommand ? readdirSync('./commands') : commandPaths).forEach(async file => {
    try {
        const cleanFile = !file.startsWith('./commands/') ? `./commands/${file}` : file;
        const code: cmd = await import(cleanFile);
        container.commands.set(code.conf.name, code);
        code.conf.aliases.forEach(alias => container.aliases.set(alias, code.conf.name));
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