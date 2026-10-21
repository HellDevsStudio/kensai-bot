const { SlashCommandBuilder, PermissionsBitField, MessageFlags } = require('discord.js');
const { NO_PERMISSION_MSG, checkPermission, checkHierarchy } = require('../../utils/permissions');
const { parseDuration, formatDuration } = require('../../utils/timeParser');
const { criarEmbedPadrao, criarEmbedErro } = require('../../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('timeout')
        .setDescription('Silencia um membro temporariamente (Castigo nativo).')
        .addUserOption(opt => opt.setName('usuario').setDescription('Membro a silenciar').setRequired(true))
        .addStringOption(opt => opt.setName('tempo').setDescription('Duração do castigo (ex: 10m, 1h, 1d)').setRequired(true))
        .addStringOption(opt => opt.setName('motivo').setDescription('Motivo do castigo').setRequired(false)),
    async execute(interaction) {
        if (!checkPermission(interaction.member, PermissionsBitField.Flags.ModerateMembers)) {
            return interaction.reply({ content: NO_PERMISSION_MSG, flags: [MessageFlags.Ephemeral] });
        }

        const targetUser = interaction.options.getUser('usuario');
        const timeStr = interaction.options.getString('tempo');
        const reason = interaction.options.getString('motivo') || 'Motivo não especificado';

        const durationMs = parseDuration(timeStr);
        if (!durationMs || durationMs < 5000 || durationMs > 28 * 24 * 60 * 60 * 1000) {
            return interaction.reply({
                content: '❌ Duração inválida! Informe um formato válido de até 28 dias (ex: `10m`, `1h`, `1d`).',
                flags: [MessageFlags.Ephemeral]
            });
        }

        const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
        if (!targetMember) {
            return interaction.reply({ content: '❌ O membro não está presente no servidor.', flags: [MessageFlags.Ephemeral] });
        }

        if (!checkHierarchy(interaction.member, targetMember)) {
            return interaction.reply({
                content: '❌ Você não pode silenciar um membro com cargo superior ou igual ao seu!',
                flags: [MessageFlags.Ephemeral]
            });
        }

        if (!targetMember.moderatable) {
            return interaction.reply({
                content: '❌ O Ken não tem permissão para silenciar este membro.',
                flags: [MessageFlags.Ephemeral]
            });
        }

        try {
            await targetMember.timeout(durationMs, reason + ' (por ' + interaction.user.tag + ')');

            const embed = criarEmbedPadrao('🔇 Membro Silenciado (Castigo)')
                .addFields(
                    { name: '👤 Membro', value: targetUser.tag + ' (`' + targetUser.id + '`)', inline: true },
                    { name: '⏱️ Duração', value: formatDuration(durationMs), inline: true },
                    { name: '🛡️ Staff Responsável', value: interaction.user.tag, inline: true },
                    { name: '📄 Motivo', value: reason, inline: false },
                    { name: '📅 Expira em', value: '<t:' + Math.floor((Date.now() + durationMs) / 1000) + ':R>', inline: false }
                );

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Erro no /timeout:', error);
            await interaction.reply({
                embeds: [criarEmbedErro('Erro no Castigo', 'Não foi possível silenciar o membro.')],
                flags: [MessageFlags.Ephemeral]
            });
        }
    }
};
