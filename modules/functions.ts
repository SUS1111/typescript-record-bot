import {
    type Client,
    type GuildMember,
    Message,
    type APIInteractionGuildMember,
    type SlashCommandBuilder,
    type ChatInputCommandInteraction,
    type SlashCommandOptionsOnlyBuilder,
    MessageMentions
} from 'discord.js';
import config from '../config';
import { type slashCommandOptionTypes } from '..';
import logger from './logger';

const permlevel = (member: GuildMember| APIInteractionGuildMember | null): number => {
    let permlvl: number = 0;
    const permOrder: config['permLevels'] = config.permLevels.slice(0).sort((p, c) => (p.level < c.level ? 1 : -1));
    while (permOrder.length) {
        const currentLevel = permOrder.shift();
        if (currentLevel?.check(member)) {
            permlvl = currentLevel.level;
            break;
        }
    }
    return permlvl;
};

const targetGet = (message: Message, args: any[]): GuildMember | undefined => {
    if (!args[0] || !message.guild) return undefined;
    if (args[0].matchAll(MessageMentions.UsersPattern).next().value) {
        return message.guild.members.cache.get(args[0].matchAll(MessageMentions.UsersPattern).next().value[1]);
    }
    return message.guild.members.cache.get(args[0]);
};

const clean = async (client: Client, text: string): Promise<string> => {
    let value: string = text;
    if (value && value.constructor.name === 'Promise') { value = await value; }
    if (typeof value !== 'string') { value = require('util').inspect(value, { depth: 1 }); }

    value = value
        .replace(/`/g, `\`${String.fromCharCode(8203)}`)
        .replace(/@/g, `@${String.fromCharCode(8203)}`);

    value = typeof client.token === 'string' ?  value.replace(new RegExp(client.token, 'g'), '[REDACTED]') : value;

    return value;
};

const addOption = (type: slashCommandOptionTypes, slashCmd: SlashCommandBuilder, option: { required: boolean, description: string, name: string }): SlashCommandOptionsOnlyBuilder => {
    // return Symbol(`add${type.charAt(0).toUpperCase() + type.slice(1)}Option`);
    const { name, description, required } = option;
    const addSlashCommandOption = (slashCommandOption: any) => slashCommandOption.setName(name).setDescription(description).setRequired(required);
    const slashCommandOption = {
        attachment: (): SlashCommandOptionsOnlyBuilder => slashCmd.addAttachmentOption(addSlashCommandOption),
        boolean: (): SlashCommandOptionsOnlyBuilder => slashCmd.addBooleanOption(addSlashCommandOption),
        channel: (): SlashCommandOptionsOnlyBuilder => slashCmd.addChannelOption(addSlashCommandOption),
        integer: (): SlashCommandOptionsOnlyBuilder => slashCmd.addIntegerOption(addSlashCommandOption),
        mentionable: (): SlashCommandOptionsOnlyBuilder => slashCmd.addMentionableOption(addSlashCommandOption),
        number: (): SlashCommandOptionsOnlyBuilder => slashCmd.addNumberOption(addSlashCommandOption),
        role: (): SlashCommandOptionsOnlyBuilder => slashCmd.addRoleOption(addSlashCommandOption),
        string: (): SlashCommandOptionsOnlyBuilder => slashCmd.addStringOption(addSlashCommandOption),
        user: (): SlashCommandOptionsOnlyBuilder => slashCmd.addUserOption(addSlashCommandOption)
    };
    try {
        return slashCommandOption[type]();
    } catch (e) {
        logger.error(e);
        return slashCmd;
    }
};

const optionToArray = (interaction: ChatInputCommandInteraction, options: Map<string, { required: boolean, description: string, type: string }>): any[] => {
    const optionName: string[] = [...options.keys()];
    const result = optionName.map(name => interaction.options.get(name)?.value);
    return result;
};

const reply = (message: Message | ChatInputCommandInteraction, reply: any): Promise<Message<boolean>> => {
    return message instanceof Message ? message.reply(reply) : message.editReply(reply);
};

export { permlevel, targetGet, clean, addOption, optionToArray, reply };