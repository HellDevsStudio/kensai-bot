const { PermissionsBitField } = require('discord.js');
const { NO_PERMISSION_MSG, checkPermission } = require('../../utils/permissions');
const { getSnipe } = require('../../utils/snipeManager');
const { criarEmbedPadrao } = require('../../utils/embeds');

module.exports = {
    name: 'snipe',
    description: 'Recupera a última mensagem apagada no canal.',
    async execute(message) {
        if (!checkPermission(message.member, PermissionsBitField.Flags.ManageMessages)) {
            return message.reply(NO_PERMISSION_MSG);
        }

        const snipe = getSnipe(message.channel.id);
        if (!snipe) {
            return message.reply('🎯 Não há nenhuma mensagem apagada recentemente neste canal!');
        }

        const embed = criarEmbedPadrao('🎯 Mensagem Recuperada (Snipe)')
            .setThumbnail(snipe.authorAvatar || null)
            .addFields(
                { name: '👤 Autor', value: snipe.authorTag + ' (`' + snipe.authorId + '`)', inline: true },
                { name: '⏱️ Apagada', value: '<t:' + Math.floor(snipe.timestamp / 1000) + ':R>', inline: true },
                { name: '💬 Conteúdo', value: snipe.content ? ('```' + snipe.content + '```') : '*Nenhum conteúdo em texto (apenas anexo/embed)*', inline: false }
            );

        if (snipe.image) {
            embed.setImage(snipe.image);
        }

        message.reply({ embeds: [embed] });
    }
};
