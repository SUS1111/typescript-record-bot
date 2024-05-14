const moment = require('moment-timezone');

const types: string[] = ['log', 'warn', 'error', 'cmd', 'ready', 'eval'];

const run = (content: string, type: string) => {
    const timestamp:string = `[${moment().tz('Asia/Taipei').format('YYYY-MM-DD HH:mm:ss')}]:`;

    if (!(types.includes(type))) {
        throw new TypeError(`選項: ${types.join(', ')}`);
    }

    console.log(`${timestamp} ${type.toUpperCase()} ${content}`);
};

export default run;