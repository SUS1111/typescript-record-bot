type commandArgumentAsArray = [string, { required: boolean, description: string, type: slashCommandOptionTypes }];

import { type Client, type Message, type ChatInputCommandInteraction, EmbedBuilder, type APIEmbedField, type ClientUser, inlineCode } from 'discord.js';
import config from '../config';
import { reply } from '../modules/functions';
import { type configCommandType, type cmd, container, type slashCommandOptionTypes } from "..";

const { commands, aliases } = container;
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

const overallHelpCommand = (bot: ClientUser) => {
    const fields: APIEmbedField[] = Array.from(categoryList, ([ name, value ]: string[]): APIEmbedField => {
        const filter: (cmd: cmd) => boolean = cmd => cmd.conf.category === name;
        const mapFunc: (value: cmd) => string = value => inlineCode(value.conf.name);
        return { name: value, value: [...commands.values()].filter(filter).map(mapFunc).join(', ') };
    });
    const embed = new EmbedBuilder()
        .setTitle('指令列表')
        .addFields(fields)
        .setColor(0xFFFF00)
        .setTimestamp()
        .setFooter({ text: bot.username, iconURL: bot.displayAvatarURL() });
    return [embed];
};

const specificHelpCommand = (bot: ClientUser, command: cmd) => {
    const { aliases, args: commandArgs, permLevel, description } = command.conf;
    const mapFunc = ([name, { required, description, type }]: commandArgumentAsArray): APIEmbedField => {
        return { name, value: `必填參數: ${required ? '是' : '否'}\n說明: ${description}\n類型: ${typeList.get(type)}` };
    };
    const argsFields: APIEmbedField[] = Array.from(commandArgs, mapFunc);
    const mainEmbed: EmbedBuilder = new EmbedBuilder()
        .setTitle(command.conf.name)
        .setDescription(description)
        .addFields({ name: '別名', value: aliases.join(', ') || '無' }, { name: '權限', value: permLevel })
        .setColor(0xFFFF00)
        .setTimestamp()
        .setFooter({ text: bot.username, iconURL: bot.displayAvatarURL() });
    const argsEmbed: EmbedBuilder = new EmbedBuilder()
        .setTitle(`${command.conf.name}的參數`)
        .setColor(0xFFFF00)
        .setTimestamp()
        .setFooter({ text: bot.username, iconURL: bot.displayAvatarURL() });
    commandArgs.size ? argsEmbed.addFields(argsFields) : argsEmbed.setDescription('無');
    return [mainEmbed, argsEmbed];
}

export const run = (client: Client<true>, message: Message<true> | ChatInputCommandInteraction<'cached'>, args: string[]) => {
    const command = commands.get(args[0]?.toLowerCase()) || commands.get(aliases.get(args[0]?.toLowerCase()) ?? '');
    if(!command && args[0]) return reply(message, { content: '查無指令' });
    return reply(message, { embeds: !command ? overallHelpCommand(client.user) : specificHelpCommand(client.user, command) });
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