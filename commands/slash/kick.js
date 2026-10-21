const { SlashCommandBuilder, PermissionsBitField, MessageFlags } = require('discord.js');
const { NO_PERMISSION_MSG, checkPermission, checkHierarchy } = require('../../utils/permissions');
const { criarEmbedPadrao, criarEmbedErro } = require('../../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Expulsa um membro do servidor.')
        .addUserOption(opt => opt.setName('usuario').setDescription('Membro a expulsar').setRequired(true))
        .addStringOption(opt => opt.setName('motivo').setDescription('Motivo da expulsão').setRequired(false)),
    async execute(interaction) {
        if (!checkPermission(interaction.member, PermissionsBitField.Flags.KickMembers)) {
            return interaction.reply({ content: NO_PERMISSION_MSG, flags: [MessageFlags.Ephemeral] });
        }

        const targetUser = interaction.options.getUser('usuario');
        const reason = interaction.options.getString('motivo') || 'Motivo não especificado';

        const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
        if (!targetMember) {
            return interaction.reply({ content: '❌ O membro não está presente no servidor.', flags: [MessageFlags.Ephemeral] });
        }

        if (!checkHierarchy(interaction.member, targetMember)) {
            return interaction.reply({
                content: '❌ Você não pode expulsar um membro com cargo superior ou igual ao seu!',
                flags: [MessageFlags.Ephemeral]
            });
        }

        if (!targetMember.kickable) {
            return interaction.reply({
                content: '❌ O Ken não tem permissão para expulsar este membro.',
                flags: [MessageFlags.Ephemeral]
            });
        }

        await targetUser.send({
            embeds: [
                criarEmbedPadrao(
                    '🥾 Você foi Expulso da Kensai Store',
                    'Você foi expulso do servidor **' + interaction.guild.name + '**.'
                ).addFields(
                    { name: '📄 Motivo', value: reason, inline: false },
                    { name: '🛡️ Staff Responsável', value: interaction.user.tag, inline: true }
                )
            ]
        }).catch(() => {});

        try {
            await targetMember.kick(reason + ' (por ' + interaction.user.tag + ')');

            const embed = criarEmbedPadrao('🥾 Membro Expulso')
                .addFields(
                    { name: '🥾 Usuário Expulso', value: targetUser.tag + ' (`' + targetUser.id + '`)', inline: true },
                    { name: '🛡️ Staff Responsável', value: interaction.user.tag, inline: true },
                    { name: '📄 Motivo', value: reason, inline: false },
                    { name: '📅 Data', value: '<t:' + Math.floor(Date.now() / 1000) + ':F>', inline: false }
                );

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Erro no /kick:', error);
            await interaction.reply({
                embeds: [criarEmbedErro('Erro na Expulsão', 'Não foi possível expulsar o membro.')],
                flags: [MessageFlags.Ephemeral]
            });
        }
    }
};
