import { codeBlock, EmbedBuilder } from 'discord.js';
import logger from '../modules/logger';
import { clean, reply } from '../modules/functions';
import type { cmd } from "..";

/*
Eval 指令非常危險，這將可以輸出你的Token，甚至是獲取、刪除整台電腦的檔案! 請務必只讓自己有操作權，尤其是用自己的伺服器架設的時候
*/

export const run: cmd['run'] = async (message, args) => {
    const code = args.join(' ');
    const zeroWidthSpace = String.fromCharCode(8203);
    try {
        // eslint-disable-next-line no-eval
        const evaled = eval(code);
        const cleaned = await clean(evaled).then(value => value.replace(/`/g, `\`${zeroWidthSpace}`).replace(/@/g, `@${zeroWidthSpace}`));
        logger.eval(`${cleaned}`);
        const jsBlock = codeBlock('js', cleaned);
        if (jsBlock.length > 4096) return reply(message, { content: '物件过大，请查看控制台' });
        return reply(message, { embeds: [new EmbedBuilder().setDescription(jsBlock).setColor(0xFFFF00)] });
    } catch (err: any) {
        logger.error(`${err}`);
        return reply(message, { content: codeBlock('js', err) });
    }
};

export const conf: cmd['conf'] = {
    aliases: [],
    permLevel: 'Owner',
    description: '執行任何 javascript 程式碼',
    args: new Map([
        ['程式碼', { required: true, description: '寫你想執行的javascript代碼', type: 'string' }]
    ]),
    category: 'system',
    name: 'eval'
};