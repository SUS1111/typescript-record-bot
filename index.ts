interface cmd { run: (client: Client, message: Message | ChatInputCommandInteraction, args: string[]) => any, conf: { name: string; permLevel: string; aliases: string[], category: string, description: string, args: Map<string, { required: boolean, description: string, type: string }> }}

import { Client, Partials, Collection, Message, REST, Routes, SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import 'dotenv/config';
import config from './config';
import logger from './modules/logger';
import { addOption } from './modules/functions';

if(!process.env.token) throw new Error('請在.env文件提供令牌!');

const client = new Client({ intents: 131071, partials: [Partials.Channel, Partials.User, Partials.GuildMember, Partials.Message, Partials.Reaction, Partials.GuildScheduledEvent, Partials.ThreadMember] });
const rest = new REST().setToken(process.env.token);

const commands = new Collection<string | undefined, cmd>();
const aliases = new Collection<string | undefined, string>();

const { permLevels, commandPaths, eventPaths, settings } = config;
const levelCache:any = {};
for (let i = 0; i < permLevels.length; i++) {
    const thisLevel = permLevels[i];
    levelCache[thisLevel.name] = thisLevel.level;
}

const container =  { commands, aliases, levelCache };
export { container };

commandPaths.forEach(async (file:string) => {
    try {
        const code:cmd = await import(file);
        console.log(code)
        const cmdName:string = code.conf.name;
        container.commands.set(cmdName, code);
        code.conf.aliases.forEach((alias:string) => container.aliases.set(alias, cmdName));
        logger(`CMD ${cmdName} 已被載入 ✅`, 'log');
    } catch (e: any) {
       logger(e, 'error');
    }
});

eventPaths.forEach(async(path, name) => {
    try {
        const { default: code } = await import(path);
        client.on(name, code.bind(null, client));
        logger(`EVENT ${name} 已被載入 ✅`, 'log');
    } catch (e: any) {
        logger(e, 'error');
    }
});

client.login(process.env.token).then(async() => {
    const cmdConf:cmd['conf'][] = commands.map((code: cmd) => code.conf);
    const slashCommands:SlashCommandBuilder[] = [];
    cmdConf.forEach(async (value:cmd['conf']) => {
        const slashCommand:SlashCommandBuilder = new SlashCommandBuilder()
            .setName(value.name)
            .setDescription(value.description);
        value.args.forEach((argValue: { required: boolean, description: string, type: string }, argName: string) => addOption(argValue.type, slashCommand, { ...argValue, name: argName }));
        slashCommands.push(slashCommand);
    });
    await rest.put(Routes.applicationCommands(settings.clientId), { body: slashCommands });
});