import config from './config.js';
import log from './log.js';

export const USER_MOVING_SELF =
  'You need to @mention a friend you want to move, not yourself. Remove your @name and try again :)';
export const MESSAGE_MISSING_MENTION = 'You need to @mention a friend!';
export const USER_NOT_IN_ANY_VOICE_CHANNEL =
  'You need to join a voice channel before moving people.';
export const USER_INSIDE_MOVEER_VOICE_CHANNEL =
  "You can't move people into this voice channel, try one that isn't named moveer.";
export const SERVER_HAS_TWO_MOVEER_VOICE_CHANNELS =
  'You seem to be having two channels called Moveer, please remove one!';
export const SERVER_IS_MISSING_MOVEER_VOICE_CHANNEL =
  'Hello, You need to create a voice channel named "Moveer"';
export const SUPPORT_MESSAGE =
  'Do you need support? Join us at the official discord and tag a moderator! https://discord.gg/dTdH3gD';
export const MOVEER_MISSING_CONNECT_PERMISSION =
  "Hey! Please make sure i got 'CONNECT' permissions in the voicechannel named ";
export const MOVEER_MISSING_MOVE_PERMISSION =
  "Hey! Please make sure i got 'MOVE_MEMBERS' permissions in the voicechannel named ";
export const MOVE_MESSAGE_CONTAINS_MENTIONS =
  "You're not supposed to @mention members with this command.";
export const NO_VOICE_CHANNEL_NAMED_X = "There's no voice channel with ";
export const NO_USERS_INSIDE_ROOM = "There's no users inside the voice channel";
export const CMOVE_OUTSIDE_MASTER = `This is an admin command, please use this inside a textchannel named "${config.masterChannel}" or add one of your choice by writing !changema #<channelName> (First time is required to be done inside ${config.masterChannel})`;
export const CMOVE_MESSAGE_MISSING_ROOM_IDENTIFER = 'You need to specify a voice channel!';
export const USER_MENTION_NOT_IN_ANY_CHANNEL = 'is not inside any voice channel!';
export const USER_ALREADY_IN_CHANNEL = 'is already inside that voice channel.';
export const VOICE_CHANNEL_NAMES_THE_SAME =
  "Please specify one channel to move from, and one to move to. It can't be the same";
export const MISSING_FNUTTS_IN_ARGS =
  'There is either too many or too few quotation marks (") or you forgot a space between the names :)';
export const USER_MOVED_WITH_TEXT_CHANNEL =
  ' <- seems to be a text channel. I can only move people inside voice channels!';

export function buildHelpMessage(movers) {
  return {
    embed: {
      fields: movers.map((mover) => ({ name: `!${mover.name}`, value: mover.description })),
    },
  };
}

export const FALLBACK_HELP_MESSAGE =
  'move - Moves @mentions to you\ncmove  Moves @mentions to a specific channel\nfmove' +
  '- Moves users inside one channel to another channel\ngmove - Moves everyone inside a channel to you. \n\n' +
  'For more information, use !help <command>\nSupport Server: <https://discord.gg/dTdH3gD>';
export function sendMessage(message, sendMessage) {
  message.channel.send(sendMessage).catch((e) => {
    logger(message, e);
    if (
      config.discordBotListToken !== 'x' &&
      message.channel.permissionsFor(message.guild.me).has('SEND_MESSAGES') === true
    ) {
      reportMoveerError('type', message);
      console.log(e);
    }
  });
}

export function logger(message, logMessage) {
  log.info(
    `${message.author.bot ? 'BOT - ' : ''}` +
      `(${message.id}) - ${message.guild.name} - (${message.channel.name}) - (${message.content}) - ${logMessage}`,
  );
}

export function reportMoveerError(type, message) {
  const Discord = require('discord.js');
  const hook = new Discord.WebhookClient(config.discordHookIdentifier, config.discordHookToken);
  if (type === 'DB') {
    hook.send(
      'New DB error reported. Check the logs for information.\nError adding ' +
        message +
        ' successful move to postgreSQL\n@everyone',
    );
  } else if (type === 'DB-CHANGE') {
    //TODO: remove db stuff
    hook.send(
      'New DB error reported. Check the logs for information.\nError changing/getting moveeradmin channel from/to POSTGRESQL\n@everyone',
    );
  } else if (type === 'MOVE') {
    hook.send(
      'New Moving error reported. Check the logs for information.\n ' + message + '\n@everyone',
    );
  } else {
    hook.send(
      'New error reported. Check the logs for information.\nCommand: ' +
        message.content +
        '\nInside textChannel: ' +
        message.channel.name +
        '\nInside server: ' +
        message.guild.name +
        '\n@everyone',
    );
  }
}
