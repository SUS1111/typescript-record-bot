import { Client, Message } from "discord.js";

interface conf { name: string; permLevel: string; aliases: string[], category: string, usage: string, description: string };

export const run = (client:Client, message:Message) => {
    message.reply(`機器人延遲: \`${Date.now() - message.createdTimestamp}\` ms\nApi延遲: \`${client.ws.ping}\` ms`);
}

export const conf: conf = {
    name: 'ping',
    permLevel: 'User',
    aliases: [],
    category: 'system',
    usage: 'ping',
    description: '回傳機器人延遲'
}