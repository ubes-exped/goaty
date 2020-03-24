import * as Helper from '../Helper.js';
import * as Message from '../Message.js';
import config from '../config.js';

export default {
  name: 'cmove',
  description: 'Moves @mentions to a specific channel',
  help: `1. Create a text channel named '${config.masterChannel}'\n2. Tell your friends to join any voice channel.\n3. Write \`!cmove <voicechannel name or id> @user1 @user2\`\n \nThis command doesn't require the author to be inside a voice channel. All \`!cmove\` commands has to be sent inside '${config.masterChannel}' since this is an admin only command.\nExample usage:\n\`!cmove Channel1 @Fragstealern#2543\`\n\`!cmove 569909202437406750 @Fragstealern#2543\`\n(If your voice channel contains spaces use\n\`!cmove "channel 2" @Fragstealern#2543\`)`,
  async move(args, message, rabbitMqChannel) {
    let messageMentions = message.mentions.users.array(); // Mentions in the message
    let toVoiceChannel;

    try {
      let toVoiceChannelName = args[0];
      if (args.join().includes('"')) {
        const names = Helper.getNameWithSpacesName(args);
        toVoiceChannelName = names[0];
      }

      await Helper.checkIfTextChannelIsMaster(message);
      Helper.checkArgsLength(args, 1);
      Helper.checkForUserMentions(message, messageMentions);
      toVoiceChannel = Helper.getChannelByName(message, toVoiceChannelName);
      Helper.checkIfVoiceChannelExist(message, toVoiceChannel, toVoiceChannelName);
      messageMentions = Helper.checkIfMentionsInsideVoiceChannel(message, messageMentions);
      messageMentions = Helper.checkIfUsersAlreadyInChannel(
        message,
        messageMentions,
        toVoiceChannel.id,
      );
      Helper.checkIfChannelIsTextChannel(message, toVoiceChannel);
      const userIdsToMove = await messageMentions.map(({ id }) => id);
      await Helper.checkForMovePerms(message, userIdsToMove, toVoiceChannel);
      await Helper.checkForConnectPerms(message, userIdsToMove, toVoiceChannel);

      // No errors in the message, lets get moving!
      if (userIdsToMove.length > 0)
        Helper.moveUsers(message, userIdsToMove, toVoiceChannel.id, rabbitMqChannel);
    } catch (err) {
      if (!err.logMessage) console.log(err);
      Message.logger(message, err.logMessage);
      Message.sendMessage(message, err.sendMessage);
    }
  },
};
