const moment = require('moment-timezone');

const types: string[] = ['log', 'warn', 'error', 'cmd', 'ready', 'eval'];

const logger: { [key: string]: (arg: string) => void } = {};

const run = (content: string, type: string) => {
    const timestamp:string = `[${moment().tz('Asia/Kuala_Lumpur').format('YYYY-MM-DD HH:mm:ss')}]:`;

    if (!(types.includes(type))) {
        throw new TypeError(`選項: ${types.join(', ')}`);
    }

    console.log(`${timestamp} ${type.toUpperCase()} ${content}`);
};

types.forEach((type: string) => {
    logger[type] = (arg: string) => run(arg, type);
});

export default logger;