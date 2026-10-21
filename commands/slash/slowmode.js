const { SlashCommandBuilder, PermissionsBitField, MessageFlags } = require('discord.js');
const { NO_PERMISSION_MSG, checkPermission } = require('../../utils/permissions');
const { criarEmbedPadrao, criarEmbedErro } = require('../../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('slowmode')
        .setDescription('Configura o modo lento do canal.')
        .addIntegerOption(opt =>
            opt.setName('segundos')
                .setDescription('Tempo em segundos (0 para desativar, máx 21600)')
                .setRequired(true)
                .setMinValue(0)
                .setMaxValue(21600)
        ),
    async execute(interaction) {
        if (!checkPermission(interaction.member, PermissionsBitField.Flags.ManageChannels)) {
            return interaction.reply({ content: NO_PERMISSION_MSG, flags: [MessageFlags.Ephemeral] });
        }

        const seconds = interaction.options.getInteger('segundos');

        try {
            await interaction.channel.setRateLimitPerUser(seconds);
            const msg = seconds === 0
                ? '⏱️ Modo lento deste canal foi **desativado**.'
                : `⏱️ Modo lento deste canal ajustado para **${seconds}** segundos.`;

            await interaction.reply({
                embeds: [criarEmbedPadrao('⏱️ Modo Lento Atualizado', msg)]
            });
        } catch (error) {
            console.error('Erro no /slowmode:', error);
            await interaction.reply({ embeds: [criarEmbedErro('Erro no Slowmode', 'Falha ao alterar o modo lento.')], flags: [MessageFlags.Ephemeral] });
        }
    }
};
