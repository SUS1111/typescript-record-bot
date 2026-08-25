import logger from "../modules/logger";

export default async (error: unknown) => {
    logger.error(JSON.stringify(error));
};

// 紀錄錯誤的事件