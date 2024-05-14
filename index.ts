interface cmd { run: (client: Client, message: Message | ChatInputCommandInteraction, args: string[]) => any, conf: { name: string; permLevel: string; aliases: string[], category: string, description: string, args: Map<string, { required: boolean, description: string, type: string }> }}

import { Client, Partials, Collection, type Message, REST, Routes, SlashCommandBuilder, type ChatInputCommandInteraction, GatewayIntentBits } from 'discord.js';
import 'dotenv/config';
import config from './config';
import logger from './modules/logger';
import { addOption } from './modules/functions';
import { lstatSync, readdirSync } from 'fs';

if(!process.env.token) throw new Error('請在.env文件提供令牌!');
if(!lstatSync(config.settings.dicPath).isDirectory()) throw new Error('並不存在該文件夾');

const client: Client = new Client({ intents: [GatewayIntentBits.AutoModerationConfiguration, GatewayIntentBits.AutoModerationExecution, GatewayIntentBits.DirectMessagePolls, GatewayIntentBits.DirectMessageReactions, GatewayIntentBits.DirectMessageTyping, GatewayIntentBits.DirectMessages, GatewayIntentBits.GuildEmojisAndStickers, GatewayIntentBits.GuildIntegrations, GatewayIntentBits.GuildInvites, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessagePolls, GatewayIntentBits.GuildMessageReactions, GatewayIntentBits.GuildMessageTyping, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildModeration, GatewayIntentBits.GuildPresences, GatewayIntentBits.GuildScheduledEvents, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildWebhooks, GatewayIntentBits.MessageContent, GatewayIntentBits.Guilds], partials: [Partials.Channel, Partials.User, Partials.GuildMember, Partials.Message, Partials.Reaction, Partials.GuildScheduledEvent, Partials.ThreadMember] });
const rest: REST = new REST().setToken(process.env.token);

const commands: Collection<string | undefined, cmd> = new Collection();
const aliases: Collection<string, string> = new Collection();

const { permLevels, commandPaths, eventPaths, settings } = config;
const levelCache: {[key: string]: number} = {};
for (let i = 0; i < permLevels.length; i++) {
    const thisLevel = permLevels[i];
    levelCache[thisLevel.name] = thisLevel.level;
}

export const container = { commands, aliases, levelCache };

const loadCommandFunc = async (file: string) => {
    try {
        if(!file.startsWith('./commands/')) file = `./commands/${file}`;
        const code:cmd = await import(file);
        const cmdName:string = code.conf.name;
        container.commands.set(cmdName, code);
        code.conf.aliases.forEach((alias:string) => container.aliases.set(alias, cmdName));
        logger.log(`CMD ${cmdName} 已被載入 ✅`);
    } catch (e: any) {
       logger.error(e);
    }
}

(config.settings.autoLoadCommand ? readdirSync('./commands') : commandPaths).forEach(loadCommandFunc);

eventPaths.forEach(async(path: string, name: string) => {
    try {
        const { default: code } = await import(path);
        client.on(name, code.bind(null, client));
        logger.log(`EVENT ${name} 已被載入 ✅`);
    } catch (e: any) {
        logger.error(e);
    }
});

client.login(process.env.token).then(async() => {
    const cmdConf:cmd['conf'][] = commands.map((code: cmd) => code.conf);
    const slashCommands:SlashCommandBuilder[] = [];
    cmdConf.forEach(async (value: cmd['conf']) => {
        const slashCommand:SlashCommandBuilder = new SlashCommandBuilder()
            .setName(value.name)
            .setDescription(value.description);
        value.args.forEach((argValue: { required: boolean, description: string, type: string }, argName: string) => addOption(argValue.type, slashCommand, { ...argValue, name: argName }));
        slashCommands.push(slashCommand);
    });
    await rest.put(Routes.applicationCommands(settings.clientId), { body: slashCommands });
});