import { container } from '..';
import config from '../config';
import { addOption } from '../modules/functions';
import logger from '../modules/logger';
import { type Client, ActivityType, Routes, SlashCommandBuilder, REST } from 'discord.js';
const { activity } = config.settings;

export default async (client: Client<true>) => {
    logger.ready(`${client.user.username}, 成員數: ${client.guilds.cache.map(g => g.memberCount).reduce((a, b) => a + b, 0)} ，伺服器數: ${client.guilds.cache.size}`);
    if(activity) client.user.setActivity(activity, { type: ActivityType.Playing });
    const rest = new REST().setToken(client.token);
    const cmdConf = container.commands.map(code => code.conf);
    const slashCommands = cmdConf.map(({ name, description, args }) => {
        const slashCommand = new SlashCommandBuilder()
            .setName(name)
            .setDescription(description);
        args.forEach((value, name) => addOption(slashCommand, { ...value, name }));
        return slashCommand;
    });
    await rest.put(Routes.applicationCommands(client.user.id), { body: slashCommands });
    logger.ready('斜线指令已准备就绪');
}