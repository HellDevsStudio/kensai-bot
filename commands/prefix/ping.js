const { EmbedBuilder } = require('discord.js');
const config = require('../../config');

module.exports = {
    name: 'ping',
    description: 'Verifica a latência do bot.',
    async execute(message, args, client) {
        const sent = await message.channel.send('🏓 Calculando...');
        const botLatency = Math.max(1, sent.createdTimestamp - message.createdTimestamp);
        const apiLatency = Math.round(client.ws.ping);

        const embed = new EmbedBuilder()
            .setColor(config.EMBED_COLOR)
            .setTitle('🏓 Pong!')
            .addFields(
                { name: '⚡ Latência do Bot', value: `\`${botLatency}ms\``, inline: true },
                { name: '🌐 Latência da API', value: `\`${apiLatency}ms\``, inline: true }
            )
            .setTimestamp();

        await sent.edit({ content: null, embeds: [embed] });
    }
};
