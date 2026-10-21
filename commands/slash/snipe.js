const { SlashCommandBuilder, PermissionsBitField, MessageFlags } = require('discord.js');
const { NO_PERMISSION_MSG, checkPermission } = require('../../utils/permissions');
const { getSnipe } = require('../../utils/snipeManager');
const { criarEmbedPadrao } = require('../../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('snipe')
        .setDescription('Recupera a última mensagem apagada no canal atual.'),
    async execute(interaction) {
        if (!checkPermission(interaction.member, PermissionsBitField.Flags.ManageMessages)) {
            return interaction.reply({ content: NO_PERMISSION_MSG, flags: [MessageFlags.Ephemeral] });
        }

        const snipe = getSnipe(interaction.channel.id);
        if (!snipe) {
            return interaction.reply({
                content: '🎯 Não há nenhuma mensagem apagada recentemente neste canal!',
                flags: [MessageFlags.Ephemeral]
            });
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

        await interaction.reply({ embeds: [embed] });
    }
};
