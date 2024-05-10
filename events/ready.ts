import config from '../config';
import logger from '../modules/logger';
import { Client, ActivityType } from 'discord.js';
const { settings } = config;

export default async (client: Client) => {
    if(!client.user) return;
    logger(`${client.user.username}, 成員數: ${client.guilds.cache.map((g:any) => g.memberCount).reduce((a:number, b:number) => a + b, 0)} ，伺服器數: ${client.guilds.cache.size}`, 'ready')
    if(settings.activity) {
        client.user.setActivity(settings.activity, { type: ActivityType.Playing });
    }
}