import {
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
import { ZipArchive } from 'archiver';
import { createWriteStream } from 'fs';
import path from 'path';
import logger from './logger';
import { inspect } from 'util';

type slashCommandBuilderOptions = SlashCommandBooleanOption | SlashCommandChannelOption | SlashCommandIntegerOption | SlashCommandMentionableOption | SlashCommandNumberOption | SlashCommandRoleOption | SlashCommandStringOption | SlashCommandUserOption; // All options except attachment

export const permlevel = (member: GuildMember): typeof config['permLevels'][number]['level'] => {
    const permOrder = config.permLevels.slice().sort((p, c) => c.level - p.level);
    return permOrder.find(({ check }) => check(member))!.level;
};

export const memberGet = (message: Message<true> | ChatInputCommandInteraction<'cached'>, member: string = ''): GuildMember | undefined => {
    const userPatern = new RegExp(MessageMentions.UsersPattern, 'g');
    const memberMatched = [...member.matchAll(userPatern)].at(0)?.at(1) ?? member;
    return message.guild.members.cache.get(memberMatched);
};

export const clean = async (object: unknown): Promise<string> => {
    const value = inspect(object instanceof Promise ? await object : object, { depth: 1 });
    return value.replace(new RegExp(process.env.token!, 'g'), '[REDACTED]');
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

export const interactionOptionToArray = (interaction: ChatInputCommandInteraction, options: cmd['conf']['args']): string[] => {
    return Array.from(options.keys(), name => interaction.options.get(name)?.value?.toString() || '');
};

export const reply = (message: Message | ChatInputCommandInteraction, reply: string | MessageReplyOptions | InteractionReplyOptions): Promise<Message> => {
    return message instanceof Message ? message.reply(reply as MessageReplyOptions | string) : message.followUp(reply as InteractionReplyOptions | string);
};

export const channelGet = (message: Message<true> | ChatInputCommandInteraction<'cached'>, channel: string = ''): GuildBasedChannel | undefined => {
    const channelPatern = new RegExp(MessageMentions.ChannelsPattern, 'g');
    const channelMatched = [...channel.matchAll(channelPatern)].at(0)?.at(1) ?? channel;
    return message.guild.channels.cache.get(channelMatched);
};

export const validFileName = (filename: string): boolean => filename !== '.' && filename !== '..' && !/[<>:"/\\|?*\u0000-\u001F]/g.test(filename) && !/^(con|prn|aux|nul|com\d|lpt\d)$/i.test(filename) && filename.length < 255;

export const fileArchive = (zipFilePath: string, ...filePaths: string[]): Promise<void> => {
    const output = createWriteStream(zipFilePath);
    const archive = new ZipArchive({ zlib: { level: 9 }});
    filePaths.forEach(filePath => archive.file(filePath, { name: path.basename(filePath) }));
    archive.pipe(output);
    return new Promise(resolve => {
        output.once('close' , () => resolve(logger.log('RECORD 文件已导出并压缩完成')));
        archive.finalize();
    });
};