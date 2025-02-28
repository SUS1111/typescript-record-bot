import type { BaseInteraction, Client } from "discord.js";
import { optionToArray, permlevel } from '../modules/functions';
import { container, type permLevel, type cmd } from '..';
import config from "../config";
import logger from "../modules/logger";

export default async(client: Client, interaction: BaseInteraction) => {
    // 當是指令則執行如下程式
    if(interaction.isChatInputCommand()) {
        try {
            // 得到使用者的權限等級
            const permlevelGet: number = permlevel(interaction.member);
            // 從指令名稱得到其export的函數
            const cmd: cmd | undefined = container.commands.get(interaction.commandName);
            await interaction.deferReply();
            if(!cmd) return interaction.followUp({ content: '並沒有這個指令' });
            // 獲得成員的權限名稱
            const permLevelName = config.permLevels.find((l: permLevel) => l.level === permlevelGet)!.name;
            // 比較權限等級，如果使用者的權限等級小於指令的權限等級，就不執行
            if (permlevelGet < container.levelCache[cmd.conf.permLevel]) {
                return interaction.followUp({ content: `你沒有權限使用!\n你的權限等級為 ${permlevelGet} (${permLevelName})\n你需要權限等級 ${container.levelCache[cmd.conf.permLevel]} (${cmd.conf.permLevel})` });
            }
            // 執行指令
            const result: any = await cmd.run(client, interaction, optionToArray(interaction, cmd.conf.args));
            // 記錄日誌
            logger.cmd(`${permLevelName} ${interaction.user.tag} 執行了 ${cmd.conf.name}`);
            // 回傳結果(雖然沒必要)
            return result;
        } catch (err: any) {
            // 回報錯誤
            logger.error(err);
            return interaction.followUp({ content: `出現了些錯誤\n\`\`\`${err.message}\`\`\``, fetchReply: true });
        }
    }
}