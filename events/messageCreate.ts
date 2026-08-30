import logger from '../modules/logger';
import config from '../config';
import { permlevel } from '../modules/functions';
import { container } from '..';
import { type Message, inlineCode, codeBlock } from 'discord.js';

const { prefix, clientId } = config.settings;

export default async (message: Message) => {
    if (!message.inGuild() || message.author.bot) return; // 確認訊息在伺服器內發送，且不為機器人
    if (message.content.match(new RegExp(`^<@!?${clientId}>( |)$`))) {
        return message.reply(`嗨! 機器人的前綴是 ${inlineCode(prefix)}`); // 如果有人提及機器人，就回覆前綴
    }

    if (message.content.toLowerCase().startsWith(prefix)) {
        try {
            // 得到 command 指令名稱 和 args 參數陣列
            const args = message.content.slice(prefix.length).trim().split(/ +/g);
            const command = args.shift()?.toLowerCase();
            // 如果沒有command或是成员中途退出伺服器則不執行
            if(!command || !message.member) return;
            // 得到使用者的權限等級
            const permlevelGet = permlevel(message.member);
            // 從指令名稱得到其export的函數
            const cmd = container.commands.get(command) ?? container.commands.get(container.aliases.get(command) ?? '');
            // 如果找不到，就不執行
            if (!cmd) return;
            // 獲得成員的權限名稱
            const permLevelName = config.permLevels.find(l => l.level === permlevelGet)!.name;
            // 比較權限等級，如果使用者的權限等級小於指令的權限等級，就不執行
            if (permlevelGet < container.levelCache[cmd.conf.permLevel]) {
                return message.channel.send(`你沒有權限使用!\n你的權限等級為 ${permlevelGet} (${permLevelName})\n你需要權限等級 ${container.levelCache[cmd.conf.permLevel]} (${cmd.conf.permLevel})`);
            }
            // 記錄日誌
            logger.cmd(`${permLevelName} ${message.author.username} 开始執行了 ${cmd.conf.name}`);
            // 執行指令
            const result = await cmd.run(message, args);
            // 記錄日誌
            logger.cmd(`${permLevelName} ${message.author.username} 成功執行了 ${cmd.conf.name}`);
            // 回傳結果(雖然沒必要)
            return result;
        } catch (err: any) {
            logger.error(err);
            // 如果出現錯誤，就回覆錯誤訊息
            message.channel.send({ content: `出現了些錯誤\n${codeBlock(err.message)}` });
        }
    }
};