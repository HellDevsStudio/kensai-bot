const { SlashCommandBuilder } = require('discord.js');
const { criarEmbedPadrao } = require('../../utils/embeds');
const { formatDuration } = require('../../utils/timeParser');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Mede a velocidade de resposta do bot e da API do Discord.'),
    async execute(interaction) {
        const sent = await interaction.deferReply({ fetchReply: true });
        const botLatency = Math.max(1, sent.createdTimestamp - interaction.createdTimestamp);
        const wsLatency = Math.round(interaction.client.ws.ping);
        const uptime = formatDuration(interaction.client.uptime);

        const embed = criarEmbedPadrao('🏓 Pong!')
            .addFields(
                { name: '⚡ Latência WebSocket', value: `\`${wsLatency >= 0 ? wsLatency : botLatency}ms\``, inline: true },
                { name: '⏱️ Uptime', value: `\`${uptime}\``, inline: true }
            );

        await interaction.editReply({ embeds: [embed] });
    }
};
