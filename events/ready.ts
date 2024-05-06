import config from '../config';
import logger from '../modules/logger';
const { settings } = config;

export default async (client:any) => {
    logger(`${client.user.username}, 成員數: ${client.guilds.cache.map((g:any) => g.memberCount).reduce((a:number, b:number) => a + b, 0)} ，伺服器數: ${client.guilds.cache.size}`, 'ready')
    if(settings.activity) {
        client.user.setActivity(settings.activity, { type: 'PLAYING' });
    }
}