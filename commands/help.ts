interface conf { name: string; permLevel: string; aliases: string[], category: string, args: Map<string, { required: boolean, description: string, type: string }>, description: string };
interface cmd { run: (client: Client, message: Message | ChatInputCommandInteraction, args: string[]) => any, conf: { name: string; permLevel: string; aliases: string[], category: string, description: string, args: Map<string, { required: boolean, description: string, type: string }> }}

import { type Client, type Message, type ChatInputCommandInteraction, EmbedBuilder, type APIEmbedField, Embed } from 'discord.js';
import { container } from '../index';
import config from '../config';
import { reply } from '../modules/functions';

export const run = (client: Client, message: Message | ChatInputCommandInteraction, args: string[]) => {
    if(!client.user) return;
    const { commands } = container;
    const { categoryList } = config;
    const typeList: Map<string, string> = new Map([
        ['attachment', '文件'],
        ['boolean', '布林值(true或false)'],
        ['channel', '頻道'],
        ['integer', '整數'],
        ['mentionable', '身份組和用戶'],
        ['number', '數字'],
        ['role', '身份組'],
        ['string', '文字'],
        ['user', '用戶']
    ]);

    if(!args[0]) {
        const fields: APIEmbedField[] = [];
        const embed: EmbedBuilder = new EmbedBuilder()
            .setTitle('指令列表')
            .setColor(0xFFFF00)
            .setTimestamp()
            .setFooter({ text: client.user.username, iconURL: client.user.displayAvatarURL() });
        categoryList.forEach((value: string, name: string) => {
            const filter: (cmd: cmd) => boolean = (cmd: cmd) => cmd.conf.category === name;
            const mapFunc: (value: cmd) => string = (value: cmd) => `\`${value.conf.name}\``;
            fields.push({ name: value, value: [...commands.values()].filter(filter).map(mapFunc).join(', ') });
        });
        embed.addFields(...fields);
        reply(message, { embeds: [embed] });
    } else {
        const command: string = args[0].toLowerCase();
        const cmd: cmd | undefined = commands.get(command);
        if(!cmd) return reply(message, { content: '查無指令' });
        const argsFields: APIEmbedField[] = [];
        cmd.conf.args.forEach(({ required, description, type }, key: string) => argsFields.push({ name: key, value: `必填參數: ${required ? '是' : '否'}\n說明: ${description}\n類型: ${typeList.get(type)}`}));
        const mainEmbed: EmbedBuilder = new EmbedBuilder()
            .setTitle(command)
            .setDescription(cmd.conf.description)
            .addFields({ name: '別名', value: cmd.conf.aliases.length ? cmd.conf.aliases.join(', ') : '無' }, { name: '權限', value: cmd.conf.permLevel })
            .setColor(0xFFFF00)
            .setTimestamp()
            .setFooter({ text: client.user.username, iconURL: client.user.displayAvatarURL() });
        const argsEmbed: EmbedBuilder = new EmbedBuilder()
            .setTitle(`${command}的參數`)
            .addFields(...argsFields)
            .setColor(0xFFFF00)
            .setTimestamp()
            .setFooter({ text: client.user.username, iconURL: client.user.displayAvatarURL() });
        reply(message, { embeds: cmd.conf.args.size ? [mainEmbed, argsEmbed] : [mainEmbed] });
    }
};

export const conf: conf = {
    name: 'help',
    permLevel: 'User',
    aliases: ['h'],
    category: 'system',
    args: new Map([
        ['指令', { required: false, description: '想獲得幫助的指令', type: 'string' }]
    ]),
    description: '獲得所有指令或是獲得指令的詳細用法'
};