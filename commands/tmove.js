import * as Helper from '../Helper.js';
import * as Message from '../Message.js';
import config from '../config.js';

export default {
  name: 'tmove',
  description: 'Moves everyone with a certain role to a channel you specify',
  help: `1. Tell users you want to move to join any voice channel\n2. Write \`!tmove channel1 damage\` where damage is the role name you want to move and channel1 is the voice channel\n \nThis command requires to be sent from the text channel \'${config.masterChannel}\'.\nIf your role contains spaces use\n\`!tmove channel1 "super admins"\``,
  async move(args, message, rabbitMqChannel) {
    try {
      let toVoiceChannelName = args[0];
      let roleName = args[1];
      if (args.join().includes('"')) {
        const names = Helper.getNameWithSpacesName(args);
        toVoiceChannelName = names[0];
        roleName = names[1];
      }
      await Helper.checkIfTextChannelIsMaster(message);
      Helper.checkArgsLength(args, 1);
      Helper.checkIfMessageContainsMentions(message);
      const toVoiceChannel = Helper.getChannelByName(message, toVoiceChannelName);
      Helper.checkIfVoiceChannelExist(message, toVoiceChannel, toVoiceChannelName);
      let usersToMove = Helper.getUsersByRole(message, roleName);
      usersToMove = Helper.checkIfUserInsideBlockedChannel(message, usersToMove);
      usersToMove = Helper.checkIfMentionsInsideVoiceChannel(message, usersToMove);
      usersToMove = Helper.checkIfUsersAlreadyInChannel(message, usersToMove, toVoiceChannel.id);
      const userIdsToMove = await usersToMove.map(({ id }) => id);
      await Helper.checkForMovePerms(message, userIdsToMove, toVoiceChannel);
      await Helper.checkForConnectPerms(message, userIdsToMove, toVoiceChannel);

      // No errors in the message, lets get moving!
      if (userIdsToMove.length > 0) {
        Helper.moveUsers(message, userIdsToMove, toVoiceChannel.id, rabbitMqChannel);
      } else {
        Message.sendMessage(message, 'Everyone ' + Message.USER_ALREADY_IN_CHANNEL);
      }
    } catch (err) {
      console.log('throwing');
      if (!err.logMessage) console.log(err);
      Message.logger(message, err.logMessage);
      Message.sendMessage(message, err.sendMessage);
    }
  },
};
