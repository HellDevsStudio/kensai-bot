const { Events } = require('discord.js');
const config = require('../config');
const { criarEmbedErro } = require('../utils/embeds');

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
            const embedErro = criarEmbedErro('Erro no Comando', 'Ocorreu um erro ao executar este comando.');
            message.reply({ embeds: [embedErro] }).catch(() => {});
        }
    }
};
