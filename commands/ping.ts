import { inlineCode } from "discord.js";
import { reply } from "../modules/functions";
import { type cmd, container } from "..";

export const run: cmd['run'] = async message => {
    const pong = await message.channel!.send('pong!');
    const botPing = pong.createdTimestamp - message.createdTimestamp;
    pong.delete();
    const apiPing = container.client.ws.ping;
    return reply(message, { content: `機器人延遲: ${inlineCode(botPing.toString())} ms\nAPI延遲: ${inlineCode(apiPing.toString())} ms` });
}

export const conf: cmd['conf'] = {
    name: 'ping',
    permLevel: 'User',
    aliases: [],
    category: 'system',
    args: new Map(),
    description: '回傳機器人延遲'
}