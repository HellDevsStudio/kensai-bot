const { SlashCommandBuilder, PermissionsBitField, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const { NO_PERMISSION_MSG, checkPermission } = require('../../utils/permissions');
const { criarEmbedPadrao } = require('../../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('nuke')
        .setDescription('Reinicia o canal atual recriando-o do zero (Exclusivo Administrador).'),
    async execute(interaction) {
        if (!checkPermission(interaction.member, PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ content: NO_PERMISSION_MSG, flags: [MessageFlags.Ephemeral] });
        }

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('nuke_confirm')
                .setLabel('⚠️ Sim, reiniciar canal!')
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId('nuke_cancel')
                .setLabel('❌ Cancelar')
                .setStyle(ButtonStyle.Secondary)
        );

        await interaction.reply({
            content: '⚠️ **ATENÇÃO:** Esta ação irá apagar todas as mensagens deste canal recriando-o idêntico. Deseja continuar?',
            components: [row],
            flags: [MessageFlags.Ephemeral]
        });
    },
    async handleButton(interaction) {
        if (!checkPermission(interaction.member, PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ content: NO_PERMISSION_MSG, flags: [MessageFlags.Ephemeral] });
        }

        if (interaction.customId === 'nuke_cancel') {
            return interaction.update({ content: '❌ Ação de reinicialização cancelada.', components: [] });
        }

        if (interaction.customId === 'nuke_confirm') {
            await interaction.update({ content: '☢️ Reiniciando canal...', components: [] });
            const channel = interaction.channel;
            const position = channel.position;
            const cloned = await channel.clone();
            await channel.delete().catch(() => {});
            await cloned.setPosition(position);

            const embed = criarEmbedPadrao(
                '☢️ Canal Reiniciado com Sucesso!',
                `Este canal foi reiniciado por **${interaction.user.tag}**.`
            ).setImage('https://media.giphy.com/media/oe33xf3B50fsc/giphy.gif');

            await cloned.send({ embeds: [embed] });
        }
    }
};
