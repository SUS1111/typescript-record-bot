import config from "../config";
import moment from "moment";

const types: string[] = ['log', 'warn', 'error', 'cmd', 'ready', 'eval'];

const logger: { [key: string]: (arg: any) => void } = {};

const run = (content: any, type: string) => {
    const timestamp: string = `[${moment.tz(config.settings.timeZone).format('YYYY-MM-DD HH:mm:ss')}]:`;

    if (!types.includes(type)) throw new TypeError(`選項: ${types.join(', ')}`);

    console.log(`${timestamp} ${type.toUpperCase()} ${content}`);
};

types.forEach((type: string) => {
    logger[type] = arg => run(arg, type);
});

export default logger;