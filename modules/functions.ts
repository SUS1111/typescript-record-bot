import {
    type Client,
    type GuildMember,
    Message,
    type APIInteractionGuildMember,
    type SlashCommandBuilder,
    type ChatInputCommandInteraction,
    type SlashCommandOptionsOnlyBuilder,
    type Channel,
    MessageMentions
} from 'discord.js';
import config from '../config';
import { type configCommandType, type slashCommandOptionTypes } from '..';

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

const memberGet = (message: Message | ChatInputCommandInteraction, member: string): GuildMember | undefined => {
    const userPatern: RegExp = new RegExp(MessageMentions.UsersPattern, 'g');
    return message.guild?.members.cache.get(member.matchAll(userPatern).next().value?.at(1) ?? member);
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

const addOption = (slashCmd: SlashCommandBuilder, option: { required: boolean, description: string, name: string, type: slashCommandOptionTypes }): SlashCommandOptionsOnlyBuilder => {
    // return Symbol(`add${type.charAt(0).toUpperCase() + type.slice(1)}Option`);
    const { name, description, required, type } = option;
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
    return slashCommandOption[type]();
};

const optionToArray = (interaction: ChatInputCommandInteraction, options: configCommandType['args']): any[] => {
    const optionName: string[] = [...options.keys()];
    const result = optionName.map(name => interaction.options.get(name)?.value);
    return result;
};

const reply = (message: Message | ChatInputCommandInteraction, reply: any): Promise<Message<boolean>> => {
    return message instanceof Message ? message.reply(reply) : message.editReply(reply);
};

const channelGet = (message: Message | ChatInputCommandInteraction, channel: string): Channel | undefined => {
    const channelPatern: RegExp = new RegExp(MessageMentions.ChannelsPattern, 'g');
    return message.guild?.channels.cache.get(channel.matchAll(channelPatern).next().value?.at(1) ?? channel);
};

const validFileName = (filename: string): boolean => filename !== '.' && filename !== '..' && !/[<>:"/\\|?*\u0000-\u001F]/g.test(filename) && !/^(con|prn|aux|nul|com\d|lpt\d)$/i.test(filename) && filename.length < 255;

export { permlevel, memberGet, clean, addOption, optionToArray, reply, channelGet, validFileName };