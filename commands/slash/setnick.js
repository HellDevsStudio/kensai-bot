const { SlashCommandBuilder, PermissionsBitField, MessageFlags } = require('discord.js');
const { NO_PERMISSION_MSG, checkPermission, checkHierarchy } = require('../../utils/permissions');
const { criarEmbedPadrao, criarEmbedErro } = require('../../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setnick')
        .setDescription('Altera o apelido de um membro no servidor.')
        .addUserOption(opt => opt.setName('usuario').setDescription('Membro').setRequired(true))
        .addStringOption(opt => opt.setName('novo_nick').setDescription('Novo apelido (ou "reset" para limpar)').setRequired(true)),
    async execute(interaction) {
        if (!checkPermission(interaction.member, PermissionsBitField.Flags.ManageNicknames)) {
            return interaction.reply({ content: NO_PERMISSION_MSG, flags: [MessageFlags.Ephemeral] });
        }

        const targetUser = interaction.options.getUser('usuario');
        const novoNick = interaction.options.getString('novo_nick');

        const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
        if (!targetMember) {
            return interaction.reply({ content: '❌ Membro não encontrado.', flags: [MessageFlags.Ephemeral] });
        }

        if (!checkHierarchy(interaction.member, targetMember)) {
            return interaction.reply({
                content: '❌ Você não pode alterar o apelido de um membro com cargo superior ou igual ao seu!',
                flags: [MessageFlags.Ephemeral]
            });
        }

        const nickFinal = novoNick.toLowerCase() === 'reset' ? null : novoNick.slice(0, 32);

        try {
            const oldNick = targetMember.displayName;
            await targetMember.setNickname(nickFinal);
            const embed = criarEmbedPadrao(
                '✏️ Apelido Alterado',
                `O apelido de ${targetMember} foi alterado com sucesso!\\n\\n👤 **Antigo:** ${oldNick}\\n✨ **Novo:** ${nickFinal || targetUser.username}`
            );
            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Erro no /setnick:', error);
            await interaction.reply({ embeds: [criarEmbedErro('Erro no Apelido', 'Não foi possível alterar o apelido deste membro.')], flags: [MessageFlags.Ephemeral] });
        }
    }
};
