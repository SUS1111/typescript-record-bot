import type { Client } from "discord.js";
import logger from "../modules/logger";

export default async (client: Client, error: unknown) => {
    logger.error(JSON.stringify(error));
};

// 紀錄錯誤的事件