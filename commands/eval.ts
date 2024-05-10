interface conf { name: string; permLevel: string; aliases: string[], category: string, args: Map<string, { required: boolean, description: string, type: string }>, description: string };

import { Client, Message, ChatInputCommandInteraction } from "discord.js";
import { codeBlock } from '@discordjs/builders';
import logger from '../modules/logger';
import { clean } from '../modules/functions';
import { reply } from "../modules/functions";

/*
Eval 指令非常危險，這將可以輸出你的Token，甚至是獲取、刪除整台電腦的檔案! 請務必只讓自己有操作權，尤其是用自己的伺服器架設的時候
*/

export const run = async (client: Client, message: Message | ChatInputCommandInteraction, args: string[]) => {
    const code: string = args.join(' ');
    try {
        // eslint-disable-next-line no-eval
        const evaled: any = eval(code);
        const cleaned: string = await clean(client, evaled);
        logger(`${cleaned}`, 'eval');
        reply(message, { content: codeBlock('js', cleaned) });
    } catch (err:any) {
        logger(`${err}`, 'error');
        reply(message, { content: codeBlock('js', err) });
    }
};

export const conf: conf = {
    aliases: [],
    permLevel: 'Owner',
    description: '執行任何 javascript 程式碼',
    args: new Map([
        ['程式碼', { required: true, description: '寫你想執行的javascript代碼', type: 'string' }]
    ]),
    category: 'system',
    name: 'eval'
};