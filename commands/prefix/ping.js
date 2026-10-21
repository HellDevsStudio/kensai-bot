const { criarEmbedPadrao } = require('../../utils/embeds');
const { formatDuration } = require('../../utils/timeParser');

module.exports = {
    name: 'ping',
    description: 'Mede a velocidade de resposta do bot e da API do Discord.',
    async execute(message, args, client) {
        const sent = await message.channel.send('🏓 Calculando...');
        const botLatency = Math.max(1, sent.createdTimestamp - message.createdTimestamp);
        const wsLatency = Math.round(client.ws.ping);
        const uptime = formatDuration(client.uptime);

        const embed = criarEmbedPadrao('🏓 Pong!')
            .addFields(
                { name: '⚡ Latência WebSocket', value: `\`${wsLatency >= 0 ? wsLatency : botLatency}ms\``, inline: true },
                { name: '⏱️ Uptime', value: `\`${uptime}\``, inline: true }
            );

        await sent.edit({ content: null, embeds: [embed] });
    }
};
