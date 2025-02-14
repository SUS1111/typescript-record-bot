type commandArgumentAsArray = [string, { required: boolean, description: string, type: slashCommandOptionTypes }];

import { type Client, type Message, type ChatInputCommandInteraction, EmbedBuilder, type APIEmbedField } from 'discord.js';
import config from '../config';
import { reply } from '../modules/functions';
import { type configCommandType, type cmd, container, type slashCommandOptionTypes } from "..";

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
        const fields: APIEmbedField[] = Array.from(categoryList, ([ name, value ]: string[]): APIEmbedField => {
            const filter: (cmd: cmd) => boolean = (cmd: cmd) => cmd.conf.category === name;
            const mapFunc: (value: cmd) => string = (value: cmd) => `\`${value.conf.name}\``;
            return { name: value, value: [...commands.values()].filter(filter).map(mapFunc).join(', ') };
        });
        const embed: EmbedBuilder = new EmbedBuilder()
            .setTitle('指令列表')
            .addFields(fields)
            .setColor(0xFFFF00)
            .setTimestamp()
            .setFooter({ text: client.user.username, iconURL: client.user.displayAvatarURL() });
        reply(message, { embeds: [embed] });
    } else {
        const command: string = args[0].toLowerCase();
        const cmd: cmd | undefined = commands.get(command);
        if(!cmd) return reply(message, { content: '查無指令' });
        const { aliases, args: commandArgs, permLevel, description } = cmd.conf;
        const mapFunc = ([name, { required, description, type }]: commandArgumentAsArray): APIEmbedField => {
            return { name, value: `必填參數: ${required ? '是' : '否'}\n說明: ${description}\n類型: ${typeList.get(type)}` };
        };
        const argsFields: APIEmbedField[] = Array.from(commandArgs, mapFunc);
        const mainEmbed: EmbedBuilder = new EmbedBuilder()
            .setTitle(command)
            .setDescription(description)
            .addFields({ name: '別名', value: aliases.length ? aliases.join(', ') : '無' }, { name: '權限', value: permLevel })
            .setColor(0xFFFF00)
            .setTimestamp()
            .setFooter({ text: client.user.username, iconURL: client.user.displayAvatarURL() });
        const argsEmbed: EmbedBuilder = new EmbedBuilder()
            .setTitle(`${command}的參數`)
            .setColor(0xFFFF00)
            .setTimestamp()
            .setFooter({ text: client.user.username, iconURL: client.user.displayAvatarURL() });
        commandArgs.size ? argsEmbed.addFields(argsFields) : argsEmbed.setDescription('無');
        reply(message, { embeds: [mainEmbed, argsEmbed] });
    }
};

export const conf: configCommandType = {
    name: 'help',
    permLevel: 'User',
    aliases: ['h'],
    category: 'system',
    args: new Map([
        ['指令', { required: false, description: '想獲得幫助的指令', type: 'string' }]
    ]),
    description: '獲得所有指令或是獲得指令的詳細用法'
};