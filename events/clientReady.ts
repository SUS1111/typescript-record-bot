import config from '../config';
import logger from '../modules/logger';
import { type Client, ActivityType, type Guild } from 'discord.js';
const { activity } = config.settings;

export default (client: Client) => {
    if(!client.user) return;
    logger.ready(`${client.user.username}, 成員數: ${client.guilds.cache.map((g: Guild) => g.memberCount).reduce((a: number, b: number) => a + b, 0)} ，伺服器數: ${client.guilds.cache.size}`);
    if(activity) client.user.setActivity(activity, { type: ActivityType.Playing });
}