const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ajuda')
        .setDescription('Mostra a lista de comandos disponíveis do bot.'),

    async execute(interaction) {
        const client = interaction.client;
        const comandosSlash = Array.from(client.slashCommands.values());

        const embed = new EmbedBuilder()
            .setColor(config.EMBED_COLOR)
            .setAuthor({ name: client.user.username, iconURL: client.user.displayAvatarURL() })
            .setTitle('📖 Central de Comandos')
            .setDescription('Confira abaixo os comandos disponíveis neste bot:')
            .setTimestamp();

        const lista = comandosSlash.map(c => `\`/${c.data.name}\` — *${c.data.description}*`).join('\n');
        embed.addFields({ name: 'Comandos Slash', value: lista || 'Nenhum comando registrado.' });

        await interaction.reply({ embeds: [embed] });
    }
};
