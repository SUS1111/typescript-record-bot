import config from '../config';
import logger from '../modules/logger';
import { type Client, ActivityType } from 'discord.js';
const { activity } = config.settings;

export default async (client: Client) => {
    if(!client.user) return;
    logger(`${client.user.username}, 成員數: ${client.guilds.cache.map((g:any) => g.memberCount).reduce((a:number, b:number) => a + b, 0)} ，伺服器數: ${client.guilds.cache.size}`, 'ready')
    if(activity) {
        client.user.setActivity(activity, { type: ActivityType.Playing });
    }
}