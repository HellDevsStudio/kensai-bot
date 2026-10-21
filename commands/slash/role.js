const { SlashCommandBuilder, PermissionsBitField, MessageFlags } = require('discord.js');
const { NO_PERMISSION_MSG, checkPermission, checkHierarchy } = require('../../utils/permissions');
const { criarEmbedPadrao, criarEmbedErro } = require('../../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('role')
        .setDescription('Gerencia cargos de membros com trava de hierarquia.')
        .addSubcommand(sub =>
            sub.setName('add')
                .setDescription('Adiciona um cargo ao membro')
                .addUserOption(opt => opt.setName('usuario').setDescription('Membro').setRequired(true))
                .addRoleOption(opt => opt.setName('cargo').setDescription('Cargo a adicionar').setRequired(true))
        )
        .addSubcommand(sub =>
            sub.setName('remove')
                .setDescription('Remove um cargo do membro')
                .addUserOption(opt => opt.setName('usuario').setDescription('Membro').setRequired(true))
                .addRoleOption(opt => opt.setName('cargo').setDescription('Cargo a remover').setRequired(true))
        ),
    async execute(interaction) {
        if (!checkPermission(interaction.member, PermissionsBitField.Flags.ManageRoles)) {
            return interaction.reply({ content: NO_PERMISSION_MSG, flags: [MessageFlags.Ephemeral] });
        }

        const sub = interaction.options.getSubcommand();
        const targetUser = interaction.options.getUser('usuario');
        const role = interaction.options.getRole('cargo');

        const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
        if (!targetMember) {
            return interaction.reply({ content: '❌ Membro não encontrado.', flags: [MessageFlags.Ephemeral] });
        }

        // Trava de hierarquia do executor em relação ao cargo
        if (interaction.guild.ownerId !== interaction.user.id && role.position >= interaction.member.roles.highest.position) {
            return interaction.reply({
                content: '❌ Você não pode gerenciar um cargo igual ou superior ao seu!',
                flags: [MessageFlags.Ephemeral]
            });
        }

        // Trava de hierarquia do bot
        const botMember = await interaction.guild.members.fetchMe();
        if (role.position >= botMember.roles.highest.position) {
            return interaction.reply({
                content: '❌ O cargo selecionado é superior ao cargo mais alto do Ken.',
                flags: [MessageFlags.Ephemeral]
            });
        }

        try {
            if (sub === 'add') {
                await targetMember.roles.add(role);
                const embed = criarEmbedPadrao('➕ Cargo Adicionado', `O cargo ${role} foi adicionado a ${targetMember} por ${interaction.user}.`);
                await interaction.reply({ embeds: [embed] });
            } else {
                await targetMember.roles.remove(role);
                const embed = criarEmbedPadrao('➖ Cargo Removido', `O cargo ${role} foi removido de ${targetMember} por ${interaction.user}.`);
                await interaction.reply({ embeds: [embed] });
            }
        } catch (error) {
            console.error('Erro no /role:', error);
            await interaction.reply({ embeds: [criarEmbedErro('Erro de Cargo', 'Não foi possível alterar o cargo do membro.')], flags: [MessageFlags.Ephemeral] });
        }
    }
};
