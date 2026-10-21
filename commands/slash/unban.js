const { SlashCommandBuilder, PermissionsBitField, MessageFlags } = require('discord.js');
const { NO_PERMISSION_MSG, checkPermission } = require('../../utils/permissions');
const { criarEmbedPadrao, criarEmbedErro } = require('../../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unban')
        .setDescription('Desbane um usuário pelo ID.')
        .addStringOption(opt => opt.setName('id').setDescription('ID do usuário a desbanir').setRequired(true))
        .addStringOption(opt => opt.setName('motivo').setDescription('Motivo do desbanimento').setRequired(false)),
    async execute(interaction) {
        if (!checkPermission(interaction.member, PermissionsBitField.Flags.BanMembers)) {
            return interaction.reply({ content: NO_PERMISSION_MSG, flags: [MessageFlags.Ephemeral] });
        }

        const targetId = interaction.options.getString('id').trim();
        const reason = interaction.options.getString('motivo') || 'Motivo não especificado';

        try {
            const banInfo = await interaction.guild.bans.fetch(targetId).catch(() => null);
            if (!banInfo) {
                return interaction.reply({
                    content: '❌ Este usuário não consta na lista de banidos do servidor.',
                    flags: [MessageFlags.Ephemeral]
                });
            }

            await interaction.guild.bans.remove(targetId, reason + ' (por ' + interaction.user.tag + ')');

            const embed = criarEmbedPadrao('🔓 Usuário Desbanido')
                .setDescription('O usuário **' + banInfo.user.tag + '** (`' + targetId + '`) teve seu acesso restaurado com sucesso.')
                .addFields(
                    { name: '🛡️ Staff Responsável', value: interaction.user.tag, inline: true },
                    { name: '📄 Motivo', value: reason, inline: true },
                    { name: '📅 Data', value: '<t:' + Math.floor(Date.now() / 1000) + ':F>', inline: false }
                );

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Erro no /unban:', error);
            await interaction.reply({
                embeds: [criarEmbedErro('Erro no Desbanimento', 'Não foi possível desbanir o ID especificado.')],
                flags: [MessageFlags.Ephemeral]
            });
        }
    }
};
