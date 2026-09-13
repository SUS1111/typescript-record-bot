import config from "../config";
import { container } from "..";

const types = ['log', 'warn', 'error', 'cmd', 'ready', 'eval'] as const;

const run = (type: typeof types[number], ...content: unknown[]) => {
    const timestamp = container.dayjs().tz(config.settings.timeZone).format('YYYY-MM-DD HH:mm:ss');

    if (!types.includes(type)) throw new TypeError(`選項: ${types.join(', ')}`);

    console.log(`[${timestamp}]: ${type.toUpperCase()} ${content.join(' ')}`);
};

export default Object.fromEntries(types.map(type => [type, content => run(type, content)])) as Record<typeof types[number], (...content: unknown[]) => void>;