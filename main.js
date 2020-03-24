// TOKEN
import amqp from 'amqplib';
import Discord from 'discord.js';
import cmove from './commands/cmove.js';
import fmove from './commands/fmove.js';
import move from './commands/move.js';
import rmove from './commands/rmove.js';
import tmove from './commands/tmove.js';
import config from './config.js';
import log from './log.js';
import * as Message from './Message.js';

const client = new Discord.Client();
const token = config.discordToken;

// rabbitMQ
const rabbitMQConnection = process.env.rabbitMQConnection || config.rabbitMQConnection;
let rabbitMqChannel;

if (config.discordBotListToken !== 'x') {
  // Only run if bot is public at discordbotlist.com
  const DBL = require('dblapi.js');
  const dbl = new DBL(config.discordBotListToken, client);
  dbl.on('posted', () => {
    log.info(`Posted Server count to DBL. Member of (${client.guilds.size}) servers`);
  });

  dbl.on('error', (e) => {
    log.warn(`DBL Error!:  ${e}`);
  });
}

client.on('ready', async () => {
  log.info('Startup successful.');
  log.info(`Running as user: ${client.user.username}`);
  try {
    const connection = await amqp.connect(rabbitMQConnection);
    rabbitMqChannel = await connection.createChannel();

    // Create a consumer for each guild that I'm inside
    client.guilds.forEach((guild) => {
      createConsumer(guild.id, rabbitMqChannel);
    });
  } catch (e) {
    log.error('Cannot connect to queuing server. ', e.stack);
  }
});

client.on('guildCreate', (guild) => {
  createConsumer(guild.id, rabbitMqChannel);
  log.info(`Joined server: ${guild.name}`);
  // Disabled until a good solution for randomly sending this out
  const welcomeMessage =
    'Hello and thanks for inviting me! If you need help or got any questions, please head over to the official Moveer discord at https://discord.gg/dTdH3gD\n';
  const supportMessage = `I got multiple commands, but to get started with !cmove, please follow the guide below.\n 1. Create a text channel and name it "${config.masterChannel}".\n 2. Ask your friends to join a voice channel X\n 3. Inside the textchannel "${config.masterChannel}" write !cmove <voicechannelY> @yourfriendsname\n4. Thats it! @yourfriend should be moved from X to voice channel Y.\n \nWe got more commands! Write !help to see them all.\nLet's get Moving!`;
  let defaultChannel = '';
  guild.channels.forEach((channel) => {
    if (channel.type === 'text' && defaultChannel === '') {
      if (
        channel.permissionsFor(guild.me).has('SEND_MESSAGES') &&
        channel.permissionsFor(guild.me).has('READ_MESSAGES')
      ) {
        defaultChannel = channel;
      }
    }
  });
  if (defaultChannel === '') {
    log.info('Failed to find defaultchannel, not sending welcome message.');
    return;
  }
  defaultChannel.send(welcomeMessage + supportMessage);
});

client.on('guildDelete', (guild) => {
  log.info(`Leaving server: ${guild.name}`);
});

client.on('rateLimit', (limit) => {
  log.info('RATELIMITED');
  log.info(limit);
});

const movers = [move, cmove, fmove, rmove, tmove];
function getMover(moverName) {
  return movers.filter(({ name }) => moverName == name)[0];
}
function moverEmbedHelp(mover) {
  return {
    embed: {
      color: 2387002,
      fields: [{ name: `!${mover.name}`, value: mover.help }],
    },
  };
}

function moverUniversalHelp() {
  return { embed: moverEmbedHelp(mover.help), text: mover.help };
}
// Listen for messages
client.on('message', (message) => {
  if (!message.content.startsWith(config.discordPrefix)) return;
  if (message.author.bot && config.allowedGuilds.indexOf(message.guild.id) === -1) return;
  if (message.channel.type !== 'text') return;
  const args = message.content.slice(config.discordPrefix.length).trim().split(/ +/g);
  const command = args.shift().toLowerCase();

  if (command === 'help') {
    if (message.author.bot) return;
    const gotEmbedPerms = message.channel.permissionsFor(message.guild.me).has('EMBED_LINKS');
    const mover = getMover(args[0]);

    const helpMessage = mover
      ? moverUniversalHelp(mover)
      : Message.buildUniversalHelpMessage(movers);
    Message.sendMessage(message, gotEmbedPerms ? helpMessage.embed : helpMessage.text);
  } else if (getMover(command)) {
    getMover(command).move(args, message, rabbitMqChannel);
  }
});

client.login(token);

function createConsumer(queue, rabbitMqChannel) {
  log.info(`Creating consumer for guild: ${queue}`);
  rabbitMqChannel.assertQueue(queue, {
    durable: true,
  });
  rabbitMqChannel.consume(
    queue,
    (msg) => {
      const jsonMsg = JSON.parse(msg.content.toString());
      log.info(
        `Moving ${jsonMsg.userId} to voiceChannel: ${jsonMsg.voiceChannelId} inside guild: ${jsonMsg.guildId}`,
      );
      client.guilds
        .get(jsonMsg.guildId)
        .member(jsonMsg.userId)
        .setVoiceChannel(jsonMsg.voiceChannelId)
        .catch((err) => {
          if (err.message !== 'Target user is not connected to voice.') {
            log.error(err);
            log.info('Got above error when moving people...');
            Message.reportMoveerError('MOVE', err.message);
          }
          log.warn(`${jsonMsg.userName} left voice before getting moved`);
        });
    },
    { noAck: true },
  );
}
