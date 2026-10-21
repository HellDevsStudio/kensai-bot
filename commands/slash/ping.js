const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Responde com a latência real do bot e da API do Discord.'),

    async execute(interaction) {
        // Medição do Round-Trip Time real pelo Discord (imune a descompasso de relógio local)
        const sent = await interaction.deferReply({ fetchReply: true });
        const botLatency = Math.max(1, sent.createdTimestamp - interaction.createdTimestamp);
        const apiLatency = Math.round(interaction.client.ws.ping);

        const embed = new EmbedBuilder()
            .setColor(config.EMBED_COLOR)
            .setTitle('🏓 Pong!')
            .addFields(
                { name: '⚡ Latência do Bot', value: `\`${botLatency}ms\``, inline: true },
                { name: '🌐 Latência da API', value: `\`${apiLatency}ms\``, inline: true }
            )
            .setFooter({ text: `Solicitado por ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    }
};
