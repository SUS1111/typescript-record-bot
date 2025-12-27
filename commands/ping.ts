import type { Client, Message, ChatInputCommandInteraction } from "discord.js";
import { inlineCode } from "discord.js";
import { reply } from "../modules/functions";
import type { configCommandType } from "..";

export const run = (client: Client<true>, message: Message<true> | ChatInputCommandInteraction<'cached'>) => {
    const botPing = Date.now() - message.createdTimestamp;
    const apiPing = client.ws.ping;
    return reply(message, { content: `機器人延遲: ${inlineCode(botPing.toString())} ms\nAPI延遲: ${inlineCode(apiPing.toString())} ms` });
}

export const conf: configCommandType = {
    name: 'ping',
    permLevel: 'User',
    aliases: [],
    category: 'system',
    args: new Map(),
    description: '回傳機器人延遲'
}