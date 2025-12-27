export interface cmd { run: (client: Client<true>, message: Message<true> | ChatInputCommandInteraction<'cached'>, args: string[]) => any, conf: { name: string; permLevel: string; aliases: string[], category: string, description: string, args: Map<string, { required: boolean, description: string, type: slashCommandOptionTypes }> }};
export type slashCommandOptionTypes = 'attachment' | 'boolean' | 'channel' | 'integer' | 'mentionable' | 'number' | 'role' | 'string' | 'user';
export interface commandArgsType { required: boolean, description: string, type: slashCommandOptionTypes };
export interface configCommandType { name: string; permLevel: string; aliases: string[], category: string, description: string, args: Map<string, commandArgsType> };
export interface permLevel { level: number, name: string, check: (member: GuildMember | APIInteractionGuildMember) => boolean };

import { Client, Partials, Collection, type Message, type ChatInputCommandInteraction, GatewayIntentBits, type GuildMember, type APIInteractionGuildMember } from 'discord.js';
import config from './config';
import logger from './modules/logger';
import { validFileName } from './modules/functions';
import { lstatSync, readdirSync } from 'fs';

const { permLevels, commandPaths, eventPaths, settings } = config;

process.loadEnvFile();

if(!process.env.token) throw new Error('請在.env文件提供令牌!');
if(!lstatSync(settings.audioOutputPath).isDirectory()) throw new Error('並不存在該文件夾');
if(!validFileName(settings.outputTimeFormat)) throw new Error('这种文件名是无效的');

const intents: GatewayIntentBits[] = [GatewayIntentBits.AutoModerationConfiguration, GatewayIntentBits.AutoModerationExecution, GatewayIntentBits.DirectMessagePolls, GatewayIntentBits.DirectMessageReactions, GatewayIntentBits.DirectMessageTyping, GatewayIntentBits.DirectMessages, GatewayIntentBits.GuildExpressions, GatewayIntentBits.GuildIntegrations, GatewayIntentBits.GuildInvites, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessagePolls, GatewayIntentBits.GuildMessageReactions, GatewayIntentBits.GuildMessageTyping, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildModeration, GatewayIntentBits.GuildPresences, GatewayIntentBits.Guilds, GatewayIntentBits.GuildScheduledEvents, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildWebhooks, GatewayIntentBits.MessageContent]; // all intents
const partials: Partials[] = [Partials.Channel, Partials.User, Partials.GuildMember, Partials.Message, Partials.Reaction, Partials.GuildScheduledEvent, Partials.ThreadMember];
const client: Client = new Client({ intents, partials });

const commands: Collection<string, cmd> = new Collection();
const aliases: Collection<string, string> = new Collection();

const levelCache: { [key: string]: number } = {};
for (let i = 0; i < permLevels.length; i++) {
    const thisLevel = permLevels[i];
    levelCache[thisLevel.name] = thisLevel.level;
}

export const container = { commands, aliases, levelCache };

(settings.autoLoadCommand ? readdirSync('./commands') : commandPaths).forEach(async (file: string) => {
    try {
        if(!file.startsWith('./commands/')) file = `./commands/${file}`;
        const code: cmd = await import(file);
        const cmdName: string = code.conf.name;
        container.commands.set(cmdName, code);
        code.conf.aliases.forEach((alias: string) => container.aliases.set(alias, cmdName));
        logger.log(`CMD ${cmdName} 已被載入 ✅`);
    } catch (e: unknown) {
       logger.error(e);
    }
});

eventPaths.forEach(async (path: string, name: string) => {
    try {
        const { default: code } = await import(path);
        client.on(name, code.bind(null, client));
        logger.log(`EVENT ${name} 已被載入 ✅`);
    } catch (e: unknown) {
        logger.error(e);
    }
});

client.login(process.env.token);