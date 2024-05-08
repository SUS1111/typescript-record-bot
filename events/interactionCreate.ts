interface permLevel { level: number, name: string, check: (member: any) => boolean }
interface cmd { run: (client: Client, message: Message | ChatInputCommandInteraction, args: string[]) => any, conf: { name: string; permLevel: string; aliases: string[], category: string , description: string , args: Map<string, { required: boolean, description: string, type: string }>}}

import { BaseInteraction, ChatInputCommandInteraction, Client, Message } from "discord.js";
import { optionToArray, permlevel } from '../modules/functions';
import { container } from '../index';
import config from "../config";
import logger from "../modules/logger";

export default async(client: Client, interaction: BaseInteraction) => {
    // 當不是指令則忽略
    if(!interaction.isChatInputCommand()) return;
    if(!interaction.guildId) return;
    try {
        // 得到使用者的權限等級
        const permlevelGet:number = permlevel(interaction.member);
        // 從指令名稱得到其export的函數
        const cmd:cmd | undefined = container.commands.get(interaction.commandName);
        await interaction.deferReply();
        if(!cmd) return interaction.followUp({ content: '並沒有這個指令' });
        // 比較權限等級，如果使用者的權限等級小於指令的權限等級，就不執行
        if (permlevelGet < container.levelCache[cmd.conf.permLevel]) {
            return interaction.followUp({ content: `你沒有權限使用!\n你的權限等級為 ${permlevelGet} (${config.permLevels.find((l: permLevel) => l.level === permlevelGet)?.name})\n你需要權限等級 ${container.levelCache[cmd.conf.permLevel]} (${cmd.conf.permLevel})` });
        }
        // 執行指令
        const result = await cmd.run(client, interaction, optionToArray(interaction, cmd.conf.args));
        // 記錄日誌
        logger(`${config.permLevels.find((l) => l.level === permlevelGet)?.name} ${interaction.user.tag} 執行了 ${cmd.conf.name}`, 'cmd');
        // 回傳結果
        return interaction.followUp(result);
    } catch (e: any) {
        // 回報錯誤
        logger(e, 'error');
        return interaction.followUp({ content: `出現了些錯誤\n\`\`\`${e.message}\`\`\`` });
    }
}