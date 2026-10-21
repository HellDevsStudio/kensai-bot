const { criarEmbedPadrao } = require('../../utils/embeds');

module.exports = {
    name: 'channelinfo',
    description: 'Exibe informações sobre o canal.',
    async execute(message, args) {
        const channel = message.mentions.channels.first() || message.channel;
        const embed = criarEmbedPadrao(`💬 Canal: #${channel.name}`)
            .addFields(
                { name: '🆔 ID', value: `\`${channel.id}\``, inline: true },
                { name: '📂 Categoria', value: channel.parent ? channel.parent.name : 'Nenhuma', inline: true },
                { name: '📅 Criado em', value: `<t:${Math.floor(channel.createdTimestamp / 1000)}:D>`, inline: true },
                { name: '📝 Tópico', value: channel.topic || 'Nenhum tópico definido.' }
            );

        await message.reply({ embeds: [embed] });
    }
};
