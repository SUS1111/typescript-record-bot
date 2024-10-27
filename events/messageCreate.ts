interface permLevel { level: number, name: string, check: (member: any) => boolean }
interface cmd { run: (client: Client, message: Message | ChatInputCommandInteraction, args: string[]) => any, conf: { name: string; permLevel: string; aliases: string[], category: string, description: string, args: Map<string, { required: boolean, description: string, type: string }> }}

import logger from '../modules/logger';
import config from '../config';
import { permlevel } from '../modules/functions';
import { container } from '../index';
import { type Client, type Message, type ChatInputCommandInteraction, ChannelType } from 'discord.js';

const { prefix } = config.settings;

export default async (client:Client, message:Message) => {
    if (!message.guildId || message.channel.type === ChannelType.GroupDM || message.author.bot) return; // 確認訊息在伺服器內發送，且不為機器人
    if (message.content.match(new RegExp(`^<@!?${client?.user?.id}>( |)$`))) {
        return message.reply(`嗨! 機器人的前綴是 \`${prefix}\``); // 如果有人提及機器人，就回覆前綴
    }

    if (message.content.toLowerCase().startsWith(prefix)) {
        try {
            // 得到 command 指令名稱 和 args 參數陣列
            const args: string[] = message.content.slice(prefix.length).trim().split(/ +/g);
            const command: string | undefined = args.shift()?.toLowerCase();
            // 如果沒有command則不執行
            if(!command) return;
            // 得到使用者的權限等級
            const permlevelGet: number = permlevel(message.member);
            // 從指令名稱得到其export的函數
            const cmd: cmd | undefined = container.commands.get(command) || container.commands.get(container.aliases.get(command));
            // 如果找不到，就不執行
            if (!cmd) return;
            // 比較權限等級，如果使用者的權限等級小於指令的權限等級，就不執行
            if (permlevelGet < container.levelCache[cmd.conf.permLevel]) {
                return message.channel.send(`你沒有權限使用!\n你的權限等級為 ${permlevelGet} (${config.permLevels.find((l: permLevel) => l.level === permlevelGet)?.name})\n你需要權限等級 ${container.levelCache[cmd.conf.permLevel]} (${cmd.conf.permLevel})`);
            }
            // 執行指令
            const result: any = await cmd.run(client, message, args);
            // 記錄日誌
            logger.cmd(`${config.permLevels.find((l: permLevel) => l.level === permlevelGet)?.name} ${message.author.tag} 執行了 ${cmd.conf.name}`);
            // 回傳結果(雖然沒必要)
            return result;
        } catch (err: any) {
            // 如果出現錯誤，就回覆錯誤訊息
            message.channel.send({ content: `出現了些錯誤\n\`\`\`${err.message}\`\`\`` });
        }
    }
};