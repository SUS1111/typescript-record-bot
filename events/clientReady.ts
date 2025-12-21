import { type configCommandType, type cmd, type commandArgsType, container } from '..';
import config from '../config';
import { addOption } from '../modules/functions';
import logger from '../modules/logger';
import { type Client, ActivityType, type Guild, Routes, SlashCommandBuilder, REST } from 'discord.js';
const { activity, clientId } = config.settings;

export default (client: Client) => {
    if(!client.user) return;
    logger.ready(`${client.user.username}, 成員數: ${client.guilds.cache.map((g: Guild) => g.memberCount).reduce((a: number, b: number) => a + b, 0)} ，伺服器數: ${client.guilds.cache.size}`);
    if(activity) client.user.setActivity(activity, { type: ActivityType.Playing });
    const rest: REST = new REST().setToken(process.env.token as string);
    const cmdConf: configCommandType[] = container.commands.map((code: cmd) => code.conf);
    const slashCommands: SlashCommandBuilder[] = cmdConf.map(({ name, description, args }): SlashCommandBuilder => {
        const slashCommand: SlashCommandBuilder = new SlashCommandBuilder()
            .setName(name)
            .setDescription(description);
        args.forEach((argValue: commandArgsType, argName: string) => addOption(slashCommand, { ...argValue, name: argName }));
        return slashCommand;
    });
    rest.put(Routes.applicationCommands(clientId), { body: slashCommands }).then(() => logger.ready('斜线指令已准备就绪'));
}