const { Events, MessageFlags } = require('discord.js');
const { criarEmbedErro } = require('../utils/embeds');

module.exports = {
    name: Events.InteractionCreate,
    once: false,
    async execute(interaction, client) {
        if (!interaction.isChatInputCommand()) return;

        const command = client.slashCommands.get(interaction.commandName);
        if (!command) {
            console.warn(`[Interação] Comando ${interaction.commandName} não encontrado.`);
            return;
        }

        try {
            await command.execute(interaction, client);
        } catch (error) {
            console.error(`❌ Erro ao executar o comando /${interaction.commandName}:`, error);
            const embedErro = criarEmbedErro('Erro na Execução', 'Ocorreu um erro ao processar este comando. Tente novamente mais tarde.');
            const erroMsg = { embeds: [embedErro], flags: [MessageFlags.Ephemeral] };
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(erroMsg).catch(() => {});
            } else {
                await interaction.reply(erroMsg).catch(() => {});
            }
        }
    }
};
