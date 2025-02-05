import { type Client, type Message, type ChatInputCommandInteraction } from "discord.js";
import { reply } from "../modules/functions";
import { type configCommandType } from "..";

export const run = (client: Client, message: Message | ChatInputCommandInteraction) => {
    reply(message, { content: `機器人延遲: \`${Date.now() - message.createdTimestamp}\` ms\nApi延遲: \`${client.ws.ping}\` ms` });
}

export const conf: configCommandType = {
    name: 'ping',
    permLevel: 'User',
    aliases: [],
    category: 'system',
    args: new Map(),
    description: '回傳機器人延遲'
}