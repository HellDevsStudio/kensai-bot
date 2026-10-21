const { SlashCommandBuilder, PermissionsBitField, MessageFlags } = require('discord.js');
const { NO_PERMISSION_MSG, checkPermission, checkHierarchy } = require('../../utils/permissions');
const { criarEmbedPadrao, criarEmbedErro } = require('../../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('untimeout')
        .setDescription('Remove o castigo (silêncio) de um membro.')
        .addUserOption(opt =>
            opt.setName('usuario')
                .setDescription('Membro a desmutar')
                .setRequired(true)
        ),
    async execute(interaction) {
        if (!checkPermission(interaction.member, PermissionsBitField.Flags.ModerateMembers)) {
            return interaction.reply({ content: NO_PERMISSION_MSG, flags: [MessageFlags.Ephemeral] });
        }

        const targetUser = interaction.options.getUser('usuario');
        const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
        if (!targetMember) {
            return interaction.reply({ content: '❌ Membro não encontrado no servidor.', flags: [MessageFlags.Ephemeral] });
        }

        if (!checkHierarchy(interaction.member, targetMember)) {
            return interaction.reply({
                content: '❌ Você não tem permissão para gerenciar este membro!',
                flags: [MessageFlags.Ephemeral]
            });
        }

        try {
            await targetMember.timeout(null, `Castigo removido por ${interaction.user.tag}`);
            const embed = criarEmbedPadrao(
                '🔊 Castigo Removido',
                `A voz de ${targetMember} foi restaurada com sucesso por ${interaction.user}.`
            );
            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Erro no /untimeout:', error);
            await interaction.reply({
                embeds: [criarEmbedErro('Erro ao Remover Castigo', 'Não foi possível remover o castigo do membro.')],
                flags: [MessageFlags.Ephemeral]
            });
        }
    }
};
