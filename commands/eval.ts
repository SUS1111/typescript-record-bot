interface conf { name: string; permLevel: string; aliases: string[], category: string, usage: string, description: string };

import { Client, Message } from "discord.js";
import { codeBlock } from '@discordjs/builders';
import logger from '../modules/logger';
import { clean } from '../modules/functions';

/*
Eval 指令非常危險，這將可以輸出你的Token，甚至是獲取、刪除整台電腦的檔案! 請務必只讓自己有操作權，尤其是用自己的伺服器架設的時候
*/

export const run = async (client: Client, message: Message, args: string[]) => {
    const code = args.join(' ');
    try {
        // eslint-disable-next-line no-eval
        const evaled = eval(code);
        const cleaned = await clean(client, evaled);
        logger(`${cleaned}`, 'eval');
        message.channel.send(codeBlock('js', cleaned));
    } catch (err:any) {
        message.channel.send(codeBlock('js', err));
        logger(`${err}`, 'error');
    }
};

export const conf: conf = {
    aliases: [],
    permLevel: 'Owner',
    description: '執行任何 javascript 程式碼',
    usage: 'eval <程式碼>',
    category: 'system',
    name: 'eval'
};