import type { Client } from "discord.js";
import logger from "../modules/logger";

export default async (client: Client<true>, error: unknown) => {
    logger.error(JSON.stringify(error));
};

// 紀錄錯誤的事件