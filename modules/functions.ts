import {
    type Client,
    type GuildMember,
    Message,
    type APIInteractionGuildMember,
    type SlashCommandBuilder,
    type ChatInputCommandInteraction,
    type SlashCommandOptionsOnlyBuilder,
    type GuildBasedChannel,
    type MessageReplyOptions,
    MessageMentions,
    type InteractionEditReplyOptions
} from 'discord.js';
import config from '../config';
import type { configCommandType, slashCommandOptionTypes } from '..';

const permlevel = (member: GuildMember | APIInteractionGuildMember | null): number => {
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

const memberGet = (message: Message | ChatInputCommandInteraction, member: string = ''): GuildMember | undefined => {
    const userPatern: RegExp = new RegExp(MessageMentions.UsersPattern, 'g');
    const memberMatched = [...member.matchAll(userPatern)].length !== 0 ? [...member.matchAll(userPatern)][0][1] : member;
    return message.guild?.members.cache.get(memberMatched);
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

const optionToArray = (interaction: ChatInputCommandInteraction, options: configCommandType['args']): string[] => {
    const optionName: string[] = [...options.keys()];
    const result = optionName.map(name => interaction.options.get(name)?.value?.toString() || '');
    return result;
};

const reply = (message: Message | ChatInputCommandInteraction, reply: string | MessageReplyOptions | InteractionEditReplyOptions): Promise<Message<boolean>> => {
    return message instanceof Message ? message.reply(reply as MessageReplyOptions) : message.editReply(reply as InteractionEditReplyOptions);
};

const channelGet = (message: Message | ChatInputCommandInteraction, channel: string = ''): GuildBasedChannel | undefined => {
    const channelPatern: RegExp = new RegExp(MessageMentions.ChannelsPattern, 'g');
    const channelMatched = [...channel.matchAll(channelPatern)].length !== 0 ? [...channel.matchAll(channelPatern)][0][1] : channel;
    return message.guild?.channels.cache.get(channelMatched);
};

const validFileName = (filename: string): boolean => filename !== '.' && filename !== '..' && !/[<>:"/\\|?*\u0000-\u001F]/g.test(filename) && !/^(con|prn|aux|nul|com\d|lpt\d)$/i.test(filename) && filename.length < 255;

export { permlevel, memberGet, clean, addOption, optionToArray, reply, channelGet, validFileName };