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
import * as Helper from './Helper.js';
import * as Message from './Message.js';

const client = new Discord.Client();
const token = config.discordToken;

// rabbitMQ
const rabbitMQConnection = process.env.rabbitMQConnection || config.rabbitMQConnection;
let rabbitMqChannel;

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
      fields: [{ name: config.discordPrefix + mover.name, value: mover.help }],
    },
  };
}

function moverUniversalHelp() {
  return { embed: moverEmbedHelp(mover.help), text: mover.help };
}
// Listen for messages
client.on('message', (message) => {
  if (!message.content.startsWith(config.discordPrefix)) return;
  if (message.author.bot && !config.allowedGuilds.includes(message.guild.id)) return;
  if (message.channel.type !== 'text') return;
  if (!Helper.isTextChannelMaster(message)) return;
  let messageContent = message.content.slice(config.discordPrefix.length).trim();
  const aliasPrefix = Object.keys(config.aliases).find((alias) => messageContent.startsWith(alias));
  if (aliasPrefix) messageContent = config.aliases[aliasPrefix];
  const args = messageContent.split(/ +/g);
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

async function createConsumer(queue, rabbitMqChannel) {
  log.info(`Creating consumer for guild: ${queue}`);
  await rabbitMqChannel.assertQueue(queue, {
    durable: true,
  });
  await rabbitMqChannel.consume(
    queue,
    async (msg) => {
      const jsonMsg = JSON.parse(msg.content.toString());
      log.info(
        `Moving ${jsonMsg.userId} to voiceChannel: ${jsonMsg.voiceChannelId} inside guild: ${jsonMsg.guildId}`,
      );
      try {
        await client.guilds
          .get(jsonMsg.guildId)
          .member(jsonMsg.userId)
          .setVoiceChannel(jsonMsg.voiceChannelId);
      } catch (e) {
        if (e.message !== 'Target user is not connected to voice.') {
          log.error(e);
          log.info('Got above error when moving people...');
          Message.reportMoveerError('MOVE', e.message);
        }
        log.warn(`${jsonMsg.userName} left voice before getting moved`);
      }
    },
    { noAck: true },
  );
}
