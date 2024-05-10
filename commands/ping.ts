import { Client, Message, ChatInputCommandInteraction } from "discord.js";
import { reply } from "../modules/functions";

interface conf { name: string; permLevel: string; aliases: string[], category: string, args: Map<string, { required: boolean, description: string, type: string }>, description: string };

export const run = (client:Client, message:Message | ChatInputCommandInteraction) => {
    reply(message, { content: `機器人延遲: \`${Date.now() - message.createdTimestamp}\` ms\nApi延遲: \`${client.ws.ping}\` ms` });
}

export const conf: conf = {
    name: 'ping',
    permLevel: 'User',
    aliases: [],
    category: 'system',
    args: new Map(),
    description: '回傳機器人延遲'
}