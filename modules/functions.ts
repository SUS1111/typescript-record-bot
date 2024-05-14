interface permLevels { level: number, name: string, check: (member: any) => boolean }[]

import Discord, { type Client, type GuildMember, Message, type APIInteractionGuildMember, type SlashCommandBuilder, type ChatInputCommandInteraction, type SlashCommandOptionsOnlyBuilder } from 'discord.js';
import config from '../config';

const permlevel = (member: GuildMember| APIInteractionGuildMember | null): number => {
    let permlvl:number = 0;
    const permOrder:permLevels[] = config.permLevels.slice(0).sort((p, c) => (p.level < c.level ? 1 : -1));
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
    if (!args[0]) return undefined;
    if (args[0].matchAll(Discord.MessageMentions.UsersPattern).next().value) {
        return message.guild?.members.cache.get(args[0].matchAll(Discord.MessageMentions.UsersPattern).next().value[1]);
    }
    return message.guild?.members.cache.get(args[0]);
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

const addOption = (type: string, slashCmd: SlashCommandBuilder, option: { required: boolean, description: string, name: string }): SlashCommandOptionsOnlyBuilder | SlashCommandBuilder => {
    // return Symbol(`add${type.charAt(0).toUpperCase() + type.slice(1)}Option`);
    const { name, description, required } = option;
    switch (type.toLocaleLowerCase()) {
        case 'string':
            return slashCmd.addStringOption((option: any) => option.setName(name).setDescription(description).setRequired(required));
        case 'channel':
            return slashCmd.addChannelOption((option: any) => option.setName(name).setDescription(description).setRequired(required));
        case 'boolean':
            return slashCmd.addBooleanOption((option: any) => option.setName(name).setDescription(description).setRequired(required));
        case 'integer':
            return slashCmd.addIntegerOption((option: any) => option.setName(name).setDescription(description).setRequired(required));
        case 'number':
            return slashCmd.addNumberOption((option: any) => option.setName(name).setDescription(description).setRequired(required));
        case 'user':
            return slashCmd.addUserOption((option: any) => option.setName(name).setDescription(description).setRequired(required));
        case 'role':
            return slashCmd.addRoleOption((option: any) => option.setName(name).setDescription(description).setRequired(required));
        case 'mentionable':
            return slashCmd.addMentionableOption((option: any) => option.setName(name).setDescription(description).setRequired(required));
        case 'attachment':
            return slashCmd.addAttachmentOption((option: any) => option.setName(name).setDescription(description).setRequired(required));
        default:
            return slashCmd;
    }
};

const optionToArray = (interaction: ChatInputCommandInteraction, options: Map<string, { required: boolean, description: string, type: string }>): any[] => {
    const optionName = [...options.keys()];
    const result = optionName.map(name => interaction.options.get(name)?.value);
    return result;
};

const reply = (message: Message | ChatInputCommandInteraction, reply: any): Promise<Discord.Message<boolean>> => {
    return message instanceof Message ? message.reply(reply) : message.editReply(reply);
};

export { permlevel, targetGet, clean, addOption, optionToArray, reply };