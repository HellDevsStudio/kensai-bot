const { SlashCommandBuilder, PermissionsBitField, MessageFlags } = require('discord.js');
const { NO_PERMISSION_MSG, checkPermission, checkHierarchy } = require('../../utils/permissions');
const { criarEmbedPadrao, criarEmbedErro } = require('../../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Bane um membro do servidor.')
        .addUserOption(opt => opt.setName('usuario').setDescription('Usuário ou membro a banir').setRequired(true))
        .addStringOption(opt => opt.setName('motivo').setDescription('Motivo do banimento').setRequired(false)),
    async execute(interaction) {
        if (!checkPermission(interaction.member, PermissionsBitField.Flags.BanMembers)) {
            return interaction.reply({ content: NO_PERMISSION_MSG, flags: [MessageFlags.Ephemeral] });
        }

        const targetUser = interaction.options.getUser('usuario');
        const reason = interaction.options.getString('motivo') || 'Motivo não especificado';

        const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
        if (targetMember && !checkHierarchy(interaction.member, targetMember)) {
            return interaction.reply({
                content: '❌ Você não pode banir um membro com cargo superior ou igual ao seu!',
                flags: [MessageFlags.Ephemeral]
            });
        }

        if (targetMember && !targetMember.bannable) {
            return interaction.reply({
                content: '❌ Não tenho permissão para banir este membro (cargo dele é superior ao meu).',
                flags: [MessageFlags.Ephemeral]
            });
        }

        await targetUser.send({
            embeds: [
                criarEmbedPadrao(
                    '🔨 Você foi Banido da Kensai Store',
                    'Você foi banido do servidor **' + interaction.guild.name + '**.'
                ).addFields(
                    { name: '📄 Motivo', value: reason, inline: false },
                    { name: '🛡️ Staff Responsável', value: interaction.user.tag, inline: true }
                )
            ]
        }).catch(() => {});

        try {
            await interaction.guild.members.ban(targetUser.id, { reason: reason + ' (por ' + interaction.user.tag + ')' });

            const embed = criarEmbedPadrao('🔨 Usuário Banido')
                .addFields(
                    { name: '🔨 Usuário Banido', value: targetUser.tag + ' (`' + targetUser.id + '`)', inline: true },
                    { name: '🛡️ Staff Responsável', value: interaction.user.tag, inline: true },
                    { name: '📄 Motivo', value: reason, inline: false },
                    { name: '📅 Data', value: '<t:' + Math.floor(Date.now() / 1000) + ':F>', inline: false }
                );

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Erro no /ban:', error);
            await interaction.reply({
                embeds: [criarEmbedErro('Erro no Banimento', 'Não foi possível banir o usuário informado.')],
                flags: [MessageFlags.Ephemeral]
            });
        }
    }
};
