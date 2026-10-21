const { criarEmbedPadrao } = require('../../utils/embeds');
const { formatDuration } = require('../../utils/timeParser');

module.exports = {
    name: 'botinfo',
    description: 'Mostra a ficha técnica do Ken.',
    async execute(message, args, client) {
        const mem = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1);
        const uptime = formatDuration(client.uptime);
        const ping = Math.round(client.ws.ping);
        const totalCmds = client.prefixCommands.size;

        const embed = criarEmbedPadrao('🤖 Ficha Técnica — Ken Bot')
            .setThumbnail(client.user.displayAvatarURL())
            .addFields(
                { name: '💻 Desenvolvedor', value: 'HellDevs Studio', inline: true },
                { name: '⚙️ Stack', value: `Node.js ${process.version} / D.js v14`, inline: true },
                { name: '🧠 Uso de RAM', value: `\`${mem} MB\``, inline: true },
                { name: '⚡ Ping WebSocket', value: `\`${ping}ms\``, inline: true },
                { name: '⏱️ Tempo Online', value: `\`${uptime}\``, inline: true },
                { name: '📊 Comandos Registrados', value: `\`${totalCmds} comandos\``, inline: true }
            );

        await message.reply({ embeds: [embed] });
    }
};
