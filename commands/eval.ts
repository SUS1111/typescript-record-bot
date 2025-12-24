import type { Client, Message, ChatInputCommandInteraction } from "discord.js";
import { codeBlock } from 'discord.js';
import logger from '../modules/logger';
import { clean, reply } from '../modules/functions';
import type { configCommandType } from "..";

/*
Eval 指令非常危險，這將可以輸出你的Token，甚至是獲取、刪除整台電腦的檔案! 請務必只讓自己有操作權，尤其是用自己的伺服器架設的時候
*/

export const run = async (client: Client, message: Message<true> | ChatInputCommandInteraction<'cached'>, args: string[]) => {
    const code: string = args.join(' ');
    try {
        // eslint-disable-next-line no-eval
        const evaled: any = eval(code);
        const cleaned: string = await clean(client, evaled);
        logger.eval(`${cleaned}`);
        reply(message, { content: codeBlock('js', cleaned) });
    } catch (err: any) {
        logger.error(`${err}`);
        reply(message, { content: codeBlock('js', err) });
    }
};

export const conf: configCommandType = {
    aliases: [],
    permLevel: 'Owner',
    description: '執行任何 javascript 程式碼',
    args: new Map([
        ['程式碼', { required: true, description: '寫你想執行的javascript代碼', type: 'string' }]
    ]),
    category: 'system',
    name: 'eval'
};