import * as Helper from '../Helper.js';
import * as Message from '../Message.js';
import config from '../config.js';

export default {
  name: 'fmove',
  description: 'Moves one channel to another channel',
  help: `1. Tell users you want to move to join voice channel A\n2. Write \`!fmove A B\` where B is the voice channel you want to move them\n \nThis command requires to be sent from the text channel \'${config.masterChannel}\'.\n(If your voice channel contains spaces use\n\`!fmove "channel 1" "channel 2"\`)`,
  async move(args, message, rabbitMqChannel) {
    try {
      let fromVoiceChannelName = args[0];
      let toVoiceChannelName = args[1];
      if (args.join().includes('"')) {
        const names = Helper.getNameWithSpacesName(args);
        fromVoiceChannelName = names[0];
        toVoiceChannelName = names[1];
      }

      await Helper.checkIfTextChannelIsMaster(message);
      Helper.checkIfMessageContainsMentions(message);
      Helper.checkArgsLength(args, 2);
      Helper.checkIfArgsTheSame(message, args);
      const fromVoiceChannel = Helper.getChannelByName(message, fromVoiceChannelName);
      const toVoiceChannel = Helper.getChannelByName(message, toVoiceChannelName);
      Helper.checkIfVoiceChannelExist(message, fromVoiceChannel, fromVoiceChannelName);
      Helper.checkIfVoiceChannelExist(message, toVoiceChannel, toVoiceChannelName);
      Helper.checkIfChannelIsTextChannel(message, toVoiceChannel);
      Helper.checkIfChannelIsTextChannel(message, fromVoiceChannel);
      Helper.checkIfUsersInsideVoiceChannel(message, fromVoiceChannelName, fromVoiceChannel);
      const userIdsToMove = await fromVoiceChannel.members.map(({ id }) => id);
      await Helper.checkForMovePerms(message, userIdsToMove, toVoiceChannel);
      await Helper.checkForConnectPerms(message, userIdsToMove, toVoiceChannel);

      // No errors in the message, lets get moving!
      Helper.moveUsers(message, userIdsToMove, toVoiceChannel.id, rabbitMqChannel);
    } catch (err) {
      if (!err.logMessage) console.log(err);
      Message.logger(message, err.logMessage);
      Message.sendMessage(message, err.sendMessage);
    }
  },
};
