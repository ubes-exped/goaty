import * as Helper from '../Helper.js';
import * as Message from '../Message.js';

export default {
  name: 'move',
  description: 'Moves @mentions to you',
  help: {
    embed: {
      color: 2387002,
      fields: [
        {
          name: '!move',
          value:
            "1. Create a voice channel named 'Moveer'\n2. Join a voice channel (Not 'Moveer')\n3. Tell users you want to move to join the channel 'Moveer'\n4. Write `!move @user1 @user2`\n \nThis command also contains an admin version that requires a text channel named 'moveeradmin'. `!move` commands sent inside this channel removes the requirement of @user1 & @user2 to join the 'Moveer' channel.\nThe author of the command can move people from any channel to any other channel.\n ",
        },
      ],
    },
  },
  async move(args, message, rabbitMqChannel) {
    let messageMentions = message.mentions.users.array(); // Mentions in the message
    try {
      const fromVoiceChannel = Helper.getChannelByName(message, 'moveer');
      Helper.checkIfAuthorInsideAVoiceChannel(message, message.member.voiceChannelID);
      Helper.checkArgsLength(args, 1);
      Helper.checkForUserMentions(message, messageMentions);
      Helper.checkIfSelfMention(message);
      if (message.channel.name.toLowerCase() !== 'moveeradmin') {
        const authorVoiceChannelName = Helper.getNameOfVoiceChannel(
          message,
          message.member.voiceChannelID,
        );
        Helper.checkIfVoiceChannelExist(message, fromVoiceChannel, 'Moveer');
        const fromVoiceChannelName = Helper.getNameOfVoiceChannel(message, fromVoiceChannel.id);
        Helper.checkIfVoiceChannelContainsMoveer(message, authorVoiceChannelName);
        Helper.checkIfGuildHasTwoMoveerChannels(message);
        Helper.checkIfUsersInsideVoiceChannel(message, fromVoiceChannelName, fromVoiceChannel);
      }
      messageMentions = Helper.checkIfMentionsInsideVoiceChannel(message, messageMentions);
      messageMentions = Helper.checkIfUsersAlreadyInChannel(
        message,
        messageMentions,
        message.member.voiceChannelID,
      );
      const userIdsToMove = await messageMentions.map(({ id }) => id);
      const authorVoiceChannel = Helper.getChannelByName(message, message.member.voiceChannelID);
      await Helper.checkForMovePerms(message, userIdsToMove, authorVoiceChannel);
      await Helper.checkForConnectPerms(message, userIdsToMove, authorVoiceChannel);

      // No errors in the message, let's get moving!
      if (userIdsToMove.length > 0)
        Helper.moveUsers(message, userIdsToMove, message.member.voiceChannelID, rabbitMqChannel);
    } catch (err) {
      if (!err.logMessage) console.log(err);
      Message.logger(message, err.logMessage);
      Message.sendMessage(message, err.sendMessage);
    }
  },
};
