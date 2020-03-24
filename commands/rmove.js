import * as Helper from '../Helper.js';
import * as Message from '../Message.js';
import config from '../config.js';

export default {
  name: 'rmove',
  description: 'Moves everyone with a certain role to you',
  help: `1. Tell users you want to move, to join any voice channel\n2. Join any other voice channel and write \`!rmove damage\` where damage is the role name you want to move\n \nThis command requires to be sent from the text channel \'${config.masterChannel}\'.\nIf your role contains spaces use\n\`!rmove "super admins"\``,
  async move(args, message, rabbitMqChannel) {
    try {
      let roleName = args[0];
      if (args.join().includes('"')) {
        const names = Helper.getNameWithSpacesName(args); // Not channels, but role
        roleName = names[0];
      }
      Helper.checkIfAuthorInsideAVoiceChannel(message, message.member.voiceChannelID);
      Helper.checkIfTextChannelIsMaster(message);
      Helper.checkIfMessageContainsMentions(message);
      Helper.checkArgsLength(args, 1);
      let usersToMove = Helper.getUsersByRole(message, roleName);
      usersToMove = Helper.checkIfUserInsideBlockedChannel(message, usersToMove);
      usersToMove = Helper.checkIfMentionsInsideVoiceChannel(message, usersToMove);
      usersToMove = Helper.checkIfUsersAlreadyInChannel(
        message,
        usersToMove,
        message.member.voiceChannelID,
      );
      const userIdsToMove = await usersToMove.map(({ id }) => id);
      const authorVoiceChannel = Helper.getChannelByName(message, message.member.voiceChannelID);
      await Helper.checkForMovePerms(message, userIdsToMove, authorVoiceChannel);
      await Helper.checkForConnectPerms(message, userIdsToMove, authorVoiceChannel);

      // No errors in the message, lets get moving!
      if (userIdsToMove.length > 0) {
        Helper.moveUsers(message, userIdsToMove, message.member.voiceChannelID, rabbitMqChannel);
      } else {
        Message.logger(message, 'All users already in the correct voice channel');
        Message.sendMessage(message, 'All users already in the correct voice channel');
      }
    } catch (err) {
      if (!err.logMessage) console.log(err);
      Message.logger(message, err.logMessage);
      Message.sendMessage(message, err.sendMessage);
    }
  },
};
