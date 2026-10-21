const { PermissionsBitField } = require('discord.js');
const { NO_PERMISSION_MSG, checkPermission, checkHierarchy } = require('../../utils/permissions');
const { criarEmbedPadrao, criarEmbedErro } = require('../../utils/embeds');

module.exports = {
    name: 'setnick',
    aliases: ['apelido', 'nick'],
    description: 'Altera o apelido de um membro.',
    async execute(message, args) {
        if (!checkPermission(message.member, PermissionsBitField.Flags.ManageNicknames)) {
            return message.reply(NO_PERMISSION_MSG);
        }

        const targetArg = args[0];
        const novoNick = args.slice(1).join(' ');

        if (!targetArg || !novoNick) {
            return message.reply('❌ Uso correto: `k!setnick [@user] [novo_nick]` (ou `reset`)');
        }

        const targetId = targetArg.replace(/[^0-9]/g, '');
        const targetMember = await message.guild.members.fetch(targetId).catch(() => null);
        if (!targetMember) {
            return message.reply('❌ Membro não encontrado.');
        }

        if (!checkHierarchy(message.member, targetMember)) {
            return message.reply('❌ Você não pode alterar o apelido de um membro com cargo superior ou igual ao seu!');
        }

        const nickFinal = novoNick.toLowerCase() === 'reset' ? null : novoNick.slice(0, 32);

        try {
            const oldNick = targetMember.displayName;
            await targetMember.setNickname(nickFinal);
            const embed = criarEmbedPadrao(
                '✏️ Apelido Alterado',
                `O apelido de ${targetMember} foi alterado com sucesso!\\n\\n👤 **Antigo:** ${oldNick}\\n✨ **Novo:** ${nickFinal || targetMember.user.username}`
            );
            message.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Erro no k!setnick:', error);
            message.reply({ embeds: [criarEmbedErro('Erro no Apelido', 'Falha ao alterar apelido.')] });
        }
    }
};
