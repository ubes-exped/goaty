import log from './log.js';
import config from './config.js';

export function embedHelpMessage(movers) {
  return {
    embed: {
      fields: movers.map((mover) => ({
        name: config.discordPrefix + mover.name,
        value: mover.description,
      })),
    },
  };
}

export function textHelpMessage(movers) {
  return (
    movers.map((mover) => `${mover.name} - ${mover.description}`).join('\n') +
    '\n\nFor more information, use !help <command>'
  );
}

export function buildUniversalHelpMessage(movers) {
  return { embed: embedHelpMessage(movers), text: textHelpMessage(movers) };
}

export function sendMessage(message, sendMessage) {
  message.channel.send(sendMessage).catch((e) => {
    logger(message, e);
  });
}

export function logger(message, logMessage) {
  log.info(
    `${message.author.bot ? 'BOT - ' : ''}` +
      `(${message.id}) - ${message.guild.name} - ` +
      `(${message.channel.name}) - (${message.content}) - ${logMessage}`,
  );
}
