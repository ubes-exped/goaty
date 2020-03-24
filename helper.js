import config from './config.js';
import * as Message from './Message.js';

export function checkIfVoiceChannelExist(message, voiceChannel, channelName) {
  const args = message.content.slice(config.discordPrefix.length).trim().split(/ +/g);
  const command = args.shift().toLowerCase();

  if (voiceChannel == null) {
    throw {
      logMessage:
        "Can't find voiceChannel: ${channelName}" +
        (message.content.slice(config.discordPrefix.length).trim().split(/ +/g).length > 3
          ? ' - Sent fnutt helper'
          : ''),
      sendMessage:
        `${Message.NO_VOICE_CHANNEL_NAMED_X}the name/id: "${channelName}" <@${message.author.id}>` +
        (command !== 'move' &&
        message.content.slice(config.discordPrefix.length).trim().split(/ +/g).length > 3
          ? '\nIf your voicechannel contains spaces, please use "" around it. Example `"channel with spaces"`'
          : ''),
    };
  }
}

export function checkArgsLength(args, expectedLength) {
  if (args.length < expectedLength) {
    throw {
      logMessage: 'Missing one or more arguments.',
      sendMessage: 'Missing arguments. !help <command> for more information',
    };
  }
}

export function checkIfArgsTheSame(message, args) {
  if (args[0].toLowerCase() === args[1].toLowerCase()) {
    throw {
      logMessage: 'Same voicechannel name',
      sendMessage: `${Message.VOICE_CHANNEL_NAMES_THE_SAME} <@${message.author.id}>`,
    };
  }
}

export function checkIfUsersInsideVoiceChannel(message, fromVoiceChannelName, fromVoiceChannel) {
  if (fromVoiceChannel === null) return;
  if (fromVoiceChannel.members.size < 1) {
    throw {
      logMessage: `No users inside the channel: ${fromVoiceChannelName}`,
      sendMessage: `${Message.NO_USERS_INSIDE_ROOM}:  ${fromVoiceChannelName} <@${message.author.id}>`,
    };
  }
}

export async function checkIfTextChannelIsMaster(message) {
  if (message.channel.name.toLowerCase() !== config.masterChannel) {
    throw {
      logMessage: 'Command made outside master channel',
      sendMessage: `${Message.CMOVE_OUTSIDE_MASTER} <@${message.author.id}>`,
    };
  }
}

export function checkForUserMentions(message, messageMentions) {
  if (messageMentions.length < 1) {
    throw {
      logMessage: '@Mention is missing',
      sendMessage: `${Message.MESSAGE_MISSING_MENTION} <@${message.author.id}>`,
    };
  }
}

export function checkIfMessageContainsMentions(message) {
  if (message.mentions.users.size > 0) {
    throw {
      logMessage: 'User tried to mention while moving groups',
      sendMessage: `${Message.MOVE_MESSAGE_CONTAINS_MENTIONS} <@${message.author.id}>`,
    };
  }
}

export function checkIfSelfMention(message) {
  if (message.mentions.users.has(message.author.id)) {
    throw {
      logMessage: 'User trying to move himself',
      sendMessage: `${Message.USER_MOVING_SELF} <@${message.author.id}>`,
    };
  }
}

export function checkIfAuthorInsideAVoiceChannel(message, userVoiceRoomID) {
  if (userVoiceRoomID == null) {
    // Check for null or undefined
    throw {
      logMessage: 'User tried to move people without being inside a voice room',
      sendMessage: `${Message.USER_NOT_IN_ANY_VOICE_CHANNEL} <@${message.author.id}>`,
    };
  }
}

export function getCategoryByName(message, categoryName) {
  let category = message.guild.channels.find(
    (category) => category.id === categoryName && category.type === 'category',
  );
  if (category === null) {
    category = message.guild.channels.find(
      (category) =>
        category.name.toLowerCase() === categoryName.toLowerCase() && category.type === 'category',
    );
  }
  if (category == null) {
    throw {
      logMessage: `Cant find category with that name: ${categoryName}`,
      sendMessage: `No category found with the name: ${categoryName} <@${message.author.id}>`,
    };
  }
  return category;
}

export function checkIfVoiceChannelContainsMoveer(message, authorVoiceChannelName) {
  if (authorVoiceChannelName.toLowerCase().includes('moveer')) {
    throw {
      logMessage: 'User trying to move people into a moveer channel',
      sendMessage: `${Message.USER_INSIDE_MOVEER_VOICE_CHANNEL} <@${message.author.id}>`,
    };
  }
}

export function checkIfGuildHasTwoMoveerChannels(message) {
  if (message.guild.channels.find((channel) => channel.name.toLowerCase() === 'Moveer') !== null) {
    throw {
      logMessage: 'User has two channels called moveer/Moveer',
      sendMessage: Message.SERVER_HAS_TWO_MOVEER_VOICE_CHANNELS,
    };
  }
}

export function checkIfMentionsInsideVoiceChannel(message, messageMentions) {
  for (let i = 0; i < messageMentions.length; i++) {
    if (message.guild.members.get(messageMentions[i].id).voiceChannelID == null) {
      // Check for null or undefined
      Message.logger(message, 'Not moving user, not in any voice channel!');
      Message.sendMessage(
        message,
        `${messageMentions[i]} ${Message.USER_MENTION_NOT_IN_ANY_CHANNEL}`,
      );
    }
  }
  return messageMentions.filter(
    (user) => message.guild.members.get(user.id).voiceChannelID != null,
  ); // Check for null or undefined
}

export function checkIfUsersAlreadyInChannel(message, messageMentions, toVoiceChannelId) {
  for (let i = 0; i < messageMentions.length; i++) {
    if (message.guild.members.get(messageMentions[i].id).voiceChannelID === toVoiceChannelId) {
      Message.logger(message, 'Not moving user, user already in the channel!');
      Message.sendMessage(
        message,
        `${messageMentions[i].username} ${Message.USER_ALREADY_IN_CHANNEL}`,
      );
    }
  }
  return messageMentions.filter(
    (user) => message.guild.members.get(user.id).voiceChannelID !== toVoiceChannelId,
  );
}

export async function checkForConnectPerms(message, users, voiceChannel) {
  for (let i = 0; i < users.length; i++) {
    const userVoiceChannelId = await message.guild.members.get(users[i]).voiceChannelID;
    const userVoiceChannel = await message.guild.channels.get(userVoiceChannelId);
    if (await !userVoiceChannel.memberPermissions(message.guild.me).has('CONNECT')) {
      throw {
        logMessage: 'Moveer is missing CONNECT permission',
        sendMessage: `${Message.MOVEER_MISSING_CONNECT_PERMISSION} "${userVoiceChannel.name}" <@${message.author.id}> \n \n${Message.SUPPORT_MESSAGE}`,
      };
    }
  }
  if (await !voiceChannel.memberPermissions(message.guild.me).has('CONNECT')) {
    throw {
      logMessage: 'Moveer is missing CONNECT permission',
      sendMessage: `${Message.MOVEER_MISSING_CONNECT_PERMISSION} "${voiceChannel.name}" <@${message.author.id}> \n \n${Message.SUPPORT_MESSAGE}`,
    };
  }
}

export async function checkForMovePerms(message, users, voiceChannel) {
  for (let i = 0; i < users.length; i++) {
    const userVoiceChannelId = await message.guild.members.get(users[i]).voiceChannelID;
    const userVoiceChannel = await message.guild.channels.get(userVoiceChannelId);
    if (await !userVoiceChannel.memberPermissions(message.guild.me).has('MOVE_MEMBERS')) {
      throw {
        logMessage: 'Moveer is missing Move Members permission',
        sendMessage: `${Message.MOVEER_MISSING_MOVE_PERMISSION} "${userVoiceChannel.name}" <@${message.author.id}> \n \n${Message.SUPPORT_MESSAGE}`,
      };
    }
  }
  if (await !voiceChannel.memberPermissions(message.guild.me).has('MOVE_MEMBERS')) {
    throw {
      logMessage: 'Moveer is missing Move Members permission',
      sendMessage: `${Message.MOVEER_MISSING_MOVE_PERMISSION} "${voiceChannel.name}" <@${message.author.id}> \n \n${Message.SUPPORT_MESSAGE}`,
    };
  }
}

export function checkIfChannelIsTextChannel(message, channel) {
  if (channel.type === 'text') {
    throw {
      logMessage: 'User tried to move with textchannels',
      sendMessage: `${channel.name}${Message.USER_MOVED_WITH_TEXT_CHANNEL} <@${message.author.id}> \n`,
    };
  }
}

export function checkIfCategoryHasRoomsAvailable(
  message,
  voiceChannelCounter,
  voiceChannelsInCategory,
  categoryName,
) {
  if (voiceChannelCounter === voiceChannelsInCategory.length) {
    // Out of rooms to move people to.
    throw {
      logMessage: `Category: ${categoryName} is out of voice channels to move users to`,
      sendMessage: `The category "${categoryName}" is out of voice channels to move users to. Please add more voice channels.`,
    };
  }
}

export function checkCountOfChannelsFromCategory(
  message,
  checkCountOfChannelsFromCategory,
  categoryName,
) {
  if (checkCountOfChannelsFromCategory.length === 0) {
    throw {
      logMessage: `Not enought voice channels in the category: ${categoryName}`,
      sendMessage: `No voicechannels exists or no empty voicechannels in the category: ${categoryName}`,
    };
  }
}

export function checkUserAmountInChannel(message, amount, expectedAmount, fromVoiceChannelName) {
  if (amount < expectedAmount) {
    throw {
      logMessage: `Not enough members inside the channel ${fromVoiceChannelName} to move. Found (${amount}) expected over (${expectedAmount})`,
      sendMessage: `Not enough members inside the channel "${fromVoiceChannelName}" to move. Found ${amount} user expected amount above ${expectedAmount}`,
    };
  }
}

export function checkIfUserInsideBlockedChannel(message, usersToMove) {
  usersToMove.forEach((user) => {
    if (config.blockedVoiceChannels.includes(user.voiceChannelID)) {
      Message.logger(message, 'One user in blocked voice channel');
      Message.sendMessage(
        message,
        `${user.user.username} is inside a blocked voice channel. Not moving!`,
      );
    }
  });
  return usersToMove.filter((user) => !config.blockedVoiceChannels.includes(user.voiceChannelID)); // Check for null or undefined
}

// Helper functions
export function getNameOfVoiceChannel(message, voiceChannelId) {
  return message.guild.channels.get(voiceChannelId).name;
}

export function getChannelByName(message, findByName) {
  let voiceChannel = message.guild.channels.find((channel) => channel.id === findByName);
  if (voiceChannel === null) {
    voiceChannel = message.guild.channels.find(
      (channel) =>
        channel.name.toLowerCase() === findByName.toLowerCase() && channel.type === 'voice',
    );
  }
  return voiceChannel;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function checkIfChannelTextExpectText(message) {
  if (message.mentions.channels.first().type !== 'text') {
    throw {
      logMessage: 'Mention is not type text',
      sendMessage: 'You need to mention the text channel using #nameoftextchannel',
    };
  }
}

export function getUsersByRole(message, roleName) {
  const role = message.guild.roles.find(
    (role) => role.name.toLowerCase() === roleName.toLowerCase(),
  );
  if (role == null) {
    // Check for null or undefined
    throw {
      logMessage:
        `Can't find role with the name: ${roleName}, ` +
        `possible roles are ${[...message.guild.roles.values()]}`,
      sendMessage: `Can't find role with the name: ${roleName}`,
    };
  }
  const usersToMove = role.members;
  return usersToMove;
}

export async function moveUsers(message, usersToMove, toVoiceChannelId, rabbitMqChannel) {
  let usersMoved = 0;
  usersToMove.forEach((user) => {
    PublishToRabbitMQ(message, user, toVoiceChannelId, rabbitMqChannel);
    usersMoved++;
  });
  Message.logger(message, `Moved ${usersMoved} ${usersMoved === 1 ? 'user' : 'users'}`);
  Message.sendMessage(
    message,
    `Moved ${usersMoved} ${usersMoved === 1 ? 'user' : 'users'}` +
      ` by request of <@${message.author.id}>`,
  );
  if (config.postgreSQLConnection !== 'x') successfulMove(usersMoved);
}

async function PublishToRabbitMQ(message, userToMove, toVoiceChannelId, rabbitMqChannel) {
  const messageToRabbitMQ = {
    userId: userToMove,
    voiceChannelId: toVoiceChannelId,
    guildId: message.guild.id,
  };
  const queue = message.guild.id;
  rabbitMqChannel.assertQueue(queue, {
    durable: true,
  });
  rabbitMqChannel.sendToQueue(queue, Buffer.from(JSON.stringify(messageToRabbitMQ)), {
    persistent: true,
  });
  Message.logger(
    message,
    `Sent message - User: ${messageToRabbitMQ.userId} toChannel: ${messageToRabbitMQ.voiceChannelId} in guild: ${messageToRabbitMQ.guildId}`,
  );
}

export function getNameWithSpacesName(args) {
  const string = args.join();
  let fnuttCounter = string[0] === '"' ? 0 : 2;
  let testFrom = '';
  let testTo = '';
  let fromVoiceChannelName;
  let toVoiceChannelName;

  for (let i = string[0] === '"' ? 0 : args[0].length; i < string.length; i++) {
    if (string[i] === '"') {
      fnuttCounter++;
      continue;
    }
    if (fnuttCounter === 2 && string[i] === ',') continue;
    if (fnuttCounter < 2) testFrom += string[i] === ',' ? ' ' : string[i];
    if (fnuttCounter > 1) testTo += string[i] === ',' ? ' ' : string[i];
  }

  if (fnuttCounter ? !(fnuttCounter % 2) : void 0) {
    fromVoiceChannelName = string[0] === '"' ? testFrom : args[0];
    toVoiceChannelName = testTo;
  } else {
    throw {
      logMessage: Message.MISSING_FNUTTS_IN_ARGS,
      sendMessage: Message.MISSING_FNUTTS_IN_ARGS,
    };
  }
  return [fromVoiceChannelName, toVoiceChannelName];
}
