# Goaty bot for Slack

A bot that moves users from one voice channel to another, on demand.

## Running the bot

- `yarn` to install the JavaScript packages
- `cp example.config.js config.js` to initialise the config file, then update as needed
- Install `rabbitmq` from your package manager of choice, making sure that `rabbitmq-server` and `rabbitmqctl` are placed in the `$PATH`.
- `./serve` to start the server, `^C` to quit it. This will also run a message queue locally, only accessible to itself.

## Commands

### **!cmove:**

Moves users spread across multiple voice channels to one without the need of joining a voice channel

Example command: `!cmove channel#1 @user1 @user2`.

### **!move:**

Moves @mentions of users inside the Moveer voice channel to you.

Example command `!move @user1 @user2`

### **!fmove:**

Moves users inside one voicechannel to another. Moves users inside overwatch to pubg.

Example command `!fmove overwatch pubg`

### **!rmove:**

Moves users with a certain role to you. For example `!rmove dps` moves all members with "dps" role to you.

Example command `!rmove "super admins"`

### **!tmove:**

Moves users with a certain role to specific channel. For example `!tmove channel1 dps` moves all members with "dps" role to channel1.

Example command `!tmove channel1 "super admins"`

## Important notes

1. If your names contains spaces use " around it. example: `!fmove "channel 1" "channel 2"`
2. All commands must be sent inside a channel as specified in the config (default goatymaster)

For more information use the !help command inside discord.

The bot ONLY requires "Use members" and "CONNECT" when inviting. The reason for it requiring Connect permissions is because discord requires it. Moveer won't join you!
