import config from './config.js';

export const USER_MOVING_SELF =
  'You need to @mention a friend you want to move, not yourself. Remove your @name and try again :)';
export const MESSAGE_MISSING_MENTION = 'You need to @mention a friend!';
export const USER_NOT_IN_ANY_VOICE_CHANNEL =
  'You need to join a voice channel before moving people.';
export const MISSING_CONNECT_PERMISSION =
  "Hey! Please make sure I got 'CONNECT' permissions in the voicechannel named ";
export const MISSING_MOVE_PERMISSION =
  "Hey! Please make sure I got 'MOVE_MEMBERS' permissions in the voicechannel named ";
export const MOVE_MESSAGE_CONTAINS_MENTIONS =
  "You're not supposed to @mention members with this command.";
export const NO_VOICE_CHANNEL_NAMED_X = "There's no voice channel with ";
export const NO_USERS_INSIDE_ROOM = "There's no users inside the voice channel";
export const CMOVE_OUTSIDE_MASTER = `This is an admin command, please use this inside a textchannel named "${config.masterChannel}"`;
export const USER_MENTION_NOT_IN_ANY_CHANNEL = 'is not inside any voice channel!';
export const USER_ALREADY_IN_CHANNEL = 'is already inside that voice channel.';
export const VOICE_CHANNEL_NAMES_THE_SAME =
  "Please specify one channel to move from, and one to move to. It can't be the same";
export const MISSING_FNUTTS_IN_ARGS =
  'There is either too many or too few quotation marks (") or you forgot a space between the names';
export const USER_MOVED_WITH_TEXT_CHANNEL =
  ' <- seems to be a text channel. I can only move people inside voice channels!';
