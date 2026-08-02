import {
    type Client,
    type GuildMember,
    Message,
    type SlashCommandBuilder,
    type ChatInputCommandInteraction,
    type SlashCommandOptionsOnlyBuilder,
    type GuildBasedChannel,
    type MessageReplyOptions,
    MessageMentions,
    type InteractionReplyOptions,
    type SlashCommandBooleanOption,
    type SlashCommandChannelOption,
    type SlashCommandIntegerOption,
    type SlashCommandMentionableOption,
    type SlashCommandNumberOption,
    type SlashCommandRoleOption,
    type SlashCommandUserOption,
    type SlashCommandStringOption
} from 'discord.js';
import config from '../config';
import type { cmd, ExtractMapKeys, ExtractMapValue, slashCommandOptionTypes } from '..';

type slashCommandBuilderOptions = SlashCommandBooleanOption | SlashCommandChannelOption | SlashCommandIntegerOption | SlashCommandMentionableOption | SlashCommandNumberOption | SlashCommandRoleOption | SlashCommandStringOption | SlashCommandUserOption; // All options except attachment

export const permlevel = (member: GuildMember | null): number => {
    if(!member) return 0;
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

export const memberGet = (message: Message<true> | ChatInputCommandInteraction<'cached'>, member: string = ''): GuildMember | undefined => {
    const userPatern: RegExp = new RegExp(MessageMentions.UsersPattern, 'g');
    const memberMatched = [...member.matchAll(userPatern)].at(0)?.at(1) ?? member;
    return message.guild.members.cache.get(memberMatched);
};

export const clean = async (client: Client, text: string): Promise<string> => {
    let value: string = text;
    if (value && value.constructor.name === 'Promise') { value = await value; }
    if (typeof value !== 'string') { value = require('util').inspect(value, { depth: 1 }); }

    value = value
        .replace(/`/g, `\`${String.fromCharCode(8203)}`)
        .replace(/@/g, `@${String.fromCharCode(8203)}`);

    value = typeof client.token === 'string' ?  value.replace(new RegExp(client.token, 'g'), '[REDACTED]') : value;

    return value;
};

export const addOption = (slashCmd: SlashCommandBuilder, option: ExtractMapValue<cmd['conf']['args']> & { name: ExtractMapKeys<cmd['conf']['args']> }): SlashCommandOptionsOnlyBuilder => {
    // return Symbol(`add${type.charAt(0).toUpperCase() + type.slice(1)}Option`);
    const { name, description, required, type } = option;
    const buildSlashCommandOption = <Type extends slashCommandBuilderOptions>(builder: Type): Type => {
        return builder.setName(name).setDescription(description).setRequired(required) as Type;
    };
    const slashCommandOption: Map<slashCommandOptionTypes, (slashCommand: SlashCommandBuilder) => SlashCommandOptionsOnlyBuilder> = new Map([
        ['boolean', (slashCommand) => slashCommand.addBooleanOption(buildSlashCommandOption)],
        ['channel', (slashCommand) => slashCommand.addChannelOption(buildSlashCommandOption)],
        ['integer', (slashCommand) => slashCommand.addIntegerOption(buildSlashCommandOption)],
        ['mentionable', (slashCommand) => slashCommand.addMentionableOption(buildSlashCommandOption)],
        ['number', (slashCommand) => slashCommand.addNumberOption(buildSlashCommandOption)],
        ['role', (slashCommand) => slashCommand.addRoleOption(buildSlashCommandOption)],
        ['string', (slashCommand) => slashCommand.addStringOption(buildSlashCommandOption)],
        ['user', (slashCommand) => slashCommand.addUserOption(buildSlashCommandOption)]
    ]);
    return slashCommandOption.get(type)!(slashCmd);
};

export const optionToArray = (interaction: ChatInputCommandInteraction, options: cmd['conf']['args']): string[] => {
    const optionName: string[] = [...options.keys()];
    const result = optionName.map(name => interaction.options.get(name)?.value?.toString() || '');
    return result;
};

export const reply = (message: Message | ChatInputCommandInteraction, reply: string | MessageReplyOptions | InteractionReplyOptions): Promise<Message<boolean>> => {
    return message instanceof Message ? message.reply(reply as MessageReplyOptions | string) : message.followUp(reply as InteractionReplyOptions | string);
};

export const channelGet = (message: Message<true> | ChatInputCommandInteraction<'cached'>, channel: string = ''): GuildBasedChannel | undefined => {
    const channelPatern: RegExp = new RegExp(MessageMentions.ChannelsPattern, 'g');
    const channelMatched = [...channel.matchAll(channelPatern)].at(0)?.at(1) ?? channel;
    return message.guild.channels.cache.get(channelMatched);
};

export const validFileName = (filename: string): boolean => filename !== '.' && filename !== '..' && !/[<>:"/\\|?*\u0000-\u001F]/g.test(filename) && !/^(con|prn|aux|nul|com\d|lpt\d)$/i.test(filename) && filename.length < 255;