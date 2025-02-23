export interface cmd { run: (client: Client, message: Message | ChatInputCommandInteraction, args: string[]) => any, conf: { name: string; permLevel: string; aliases: string[], category: string, description: string, args: Map<string, { required: boolean, description: string, type: slashCommandOptionTypes }> }};
export type slashCommandOptionTypes = 'attachment' | 'boolean' | 'channel' | 'integer' | 'mentionable' | 'number' | 'role' | 'string' | 'user';
export interface configCommandType { name: string; permLevel: string; aliases: string[], category: string, description: string, args: Map<string, { required: boolean, description: string, type: slashCommandOptionTypes }> };
export interface permLevel { level: number, name: string, check: (member: any) => boolean }

import { Client, Partials, Collection, type Message, REST, Routes, SlashCommandBuilder, type ChatInputCommandInteraction, GatewayIntentBits } from 'discord.js';
import 'dotenv/config';
import config from './config';
import logger from './modules/logger';
import { addOption, validFileName } from './modules/functions';
import { lstatSync, readdirSync } from 'fs';
import moment from 'moment-timezone';

const { permLevels, commandPaths, eventPaths, settings } = config;

if(!process.env.token) throw new Error('請在.env文件提供令牌!');
if(!lstatSync(settings.audioOutputPath).isDirectory()) throw new Error('並不存在該文件夾');
if(!validFileName(settings.outputTimeFormat)) throw new Error('这种文件名是无效的');

const intents: GatewayIntentBits[] = [GatewayIntentBits.AutoModerationConfiguration, GatewayIntentBits.AutoModerationExecution, GatewayIntentBits.DirectMessagePolls, GatewayIntentBits.DirectMessageReactions, GatewayIntentBits.DirectMessageTyping, GatewayIntentBits.DirectMessages, GatewayIntentBits.GuildExpressions, GatewayIntentBits.GuildIntegrations, GatewayIntentBits.GuildInvites, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessagePolls, GatewayIntentBits.GuildMessageReactions, GatewayIntentBits.GuildMessageTyping, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildModeration, GatewayIntentBits.GuildPresences, GatewayIntentBits.Guilds, GatewayIntentBits.GuildScheduledEvents, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildWebhooks, GatewayIntentBits.MessageContent]; // all intents
const partials: Partials[] = [Partials.Channel, Partials.User, Partials.GuildMember, Partials.Message, Partials.Reaction, Partials.GuildScheduledEvent, Partials.ThreadMember];
const client: Client = new Client({ intents, partials });
const rest: REST = new REST().setToken(process.env.token);

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
    } catch (e: any) {
       logger.error(e);
    }
});

eventPaths.forEach(async (path: string, name: string) => {
    try {
        const { default: code } = await import(path);
        client.on(name, code.bind(null, client));
        logger.log(`EVENT ${name} 已被載入 ✅`);
    } catch (e: any) {
        logger.error(e);
    }
});

client.login(process.env.token).then(() => {
    const cmdConf: configCommandType[] = commands.map((code: cmd) => code.conf);
    const slashCommands: SlashCommandBuilder[] = cmdConf.map(({ name, description, args }): SlashCommandBuilder => {
        const slashCommand: SlashCommandBuilder = new SlashCommandBuilder()
            .setName(name)
            .setDescription(description);
        args.forEach((argValue: { required: boolean, description: string, type: slashCommandOptionTypes }, argName: string) => addOption(slashCommand, { ...argValue, name: argName }));
        return slashCommand;
    });
    return rest.put(Routes.applicationCommands(settings.clientId), { body: slashCommands });
});