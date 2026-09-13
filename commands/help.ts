type commandArgumentAsArray = [ExtractReadonlyMapKeys<cmd['conf']['args']>, ExtractReadonlyMapValues<cmd['conf']['args']>];

import { EmbedBuilder, type APIEmbedField, type ClientUser, inlineCode, type EmbedFooterData } from 'discord.js';
import config from '../config';
import { reply } from '../modules/functions';
import { type cmd, container, type ExtractReadonlyMapValues, type ExtractReadonlyMapKeys, type slashCommandOptionTypes } from "..";

const { commands, aliases } = container;
const { categoryList } = config;
const typeList: ReadonlyMap<slashCommandOptionTypes, string> = new Map([
    ['boolean', '布林值(true或false)'],
    ['channel', '頻道'],
    ['integer', '整數'],
    ['mentionable', '身份組和用戶'],
    ['number', '數字'],
    ['role', '身份組'],
    ['string', '文字'],
    ['user', '用戶']
]);

const overallHelpCommand = (bot: ClientUser): [EmbedBuilder] => {
    const fields = Array.from(categoryList, ([ categoryId, categoryName ]: string[]): APIEmbedField => {
        const flatMapFunc = (cmd: cmd) => cmd.conf.category === categoryId ? inlineCode(cmd.conf.name) : [];
        return { name: categoryName!, value: [...commands.values()].flatMap(flatMapFunc).join(', ') };
    });
    const footer: EmbedFooterData = { text: bot.username, iconURL: bot.displayAvatarURL() };
    return [new EmbedBuilder({ title: '指令列表', fields, color: 0xFFF000, timestamp: Date.now(), footer })];
};

const specificHelpCommand = (bot: ClientUser, command: cmd): [EmbedBuilder, EmbedBuilder] => {
    const { aliases, args: commandArgs, permLevel, description } = command.conf;
    const mapFunc = ([name, { required, description, type }]: commandArgumentAsArray): APIEmbedField => {
        return { name, value: `必填參數: ${required ? '是' : '否'}\n說明: ${description}\n類型: ${typeList.get(type)}` };
    };
    const argsFields = Array.from(commandArgs, mapFunc);
    const footer: EmbedFooterData = { text: bot.username, iconURL: bot.displayAvatarURL() };
    const mainEmbed = new EmbedBuilder({
        title: command.conf.name,
        description,
        fields: [{ name: '別名', value: aliases.join(', ') || '無' }, { name: '權限', value: permLevel }],
        color: 0xFFF000,
        timestamp: Date.now(),
        footer
    });
    const argsEmbed = new EmbedBuilder({ title: `${command.conf.name}的參數`, color: 0xFFF000, timestamp: Date.now(), footer });
    return [mainEmbed, commandArgs.size ? argsEmbed.addFields(argsFields) : argsEmbed.setDescription('無')];
}

export const run: cmd['run'] = (message, args) => {
    const { client } = message.guild;
    if(!args[0]) return reply(message, { embeds: overallHelpCommand(client.user) });
    const command = commands.get(aliases.get(args[0].toLowerCase()) ?? args[0].toLowerCase());
    return reply(message, !command ? { content: '查無指令' } : { embeds: specificHelpCommand(client.user, command) });
};

export const conf: cmd['conf'] = {
    name: 'help',
    permLevel: 'User',
    aliases: ['h'],
    category: 'system',
    args: new Map([
        ['指令', { required: false, description: '想獲得幫助的指令', type: 'string' }]
    ]),
    description: '獲得所有指令或是獲得指令的詳細用法'
};