import config from "../config";
import moment from "moment-timezone";

const types = ['log', 'warn', 'error', 'cmd', 'ready', 'eval'] as const;

const run = (content: unknown, type: typeof types[number]) => {
    const timestamp = `[${moment().tz(config.settings.timeZone).format('YYYY-MM-DD HH:mm:ss')}]:`;

    if (!types.includes(type)) throw new TypeError(`選項: ${types.join(', ')}`);

    console.log(`${timestamp} ${type.toUpperCase()} ${content}`);
};

export default Object.fromEntries(types.map(type => [type, content => run(content, type)])) as Record<typeof types[number], (content: unknown) => void>;