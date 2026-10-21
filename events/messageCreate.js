const { Events } = require('discord.js');
const config = require('../config');

module.exports = {
    name: Events.MessageCreate,
    once: false,
    async execute(message, client) {
        if (message.author.bot || !message.guild) return;

        const prefix = config.PREFIX;
        if (!message.content.toLowerCase().startsWith(prefix.toLowerCase())) return;

        const args = message.content.slice(prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();

        const command = client.prefixCommands.get(commandName);
        if (!command) return;

        try {
            await command.execute(message, args, client);
        } catch (error) {
            console.error(`❌ Erro ao executar comando de prefixo ${prefix}${commandName}:`, error);
            message.reply('❌ Ocorreu um erro ao executar este comando.').catch(() => {});
        }
    }
};
