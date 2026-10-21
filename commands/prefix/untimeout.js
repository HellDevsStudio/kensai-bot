const { PermissionsBitField } = require('discord.js');
const { NO_PERMISSION_MSG, checkPermission, checkHierarchy } = require('../../utils/permissions');
const { criarEmbedPadrao, criarEmbedErro } = require('../../utils/embeds');

module.exports = {
    name: 'untimeout',
    aliases: ['unmute', 'desmutar'],
    description: 'Remove o castigo de um membro.',
    async execute(message, args) {
        if (!checkPermission(message.member, PermissionsBitField.Flags.ModerateMembers)) {
            return message.reply(NO_PERMISSION_MSG);
        }

        const targetArg = args[0];
        if (!targetArg) {
            return message.reply('❌ Uso correto: `k!unmute [@user]`');
        }

        const targetId = targetArg.replace(/[^0-9]/g, '');
        const targetMember = await message.guild.members.fetch(targetId).catch(() => null);
        if (!targetMember) {
            return message.reply('❌ Membro não encontrado no servidor.');
        }

        if (!checkHierarchy(message.member, targetMember)) {
            return message.reply('❌ Você não tem permissão para gerenciar este membro!');
        }

        try {
            await targetMember.timeout(null, `Castigo removido por ${message.author.tag}`);
            const embed = criarEmbedPadrao(
                '🔊 Castigo Removido',
                `A voz de ${targetMember} foi restaurada com sucesso por ${message.author}.`
            );
            message.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Erro no k!untimeout:', error);
            message.reply({ embeds: [criarEmbedErro('Erro ao Remover Castigo', 'Falha ao remover o castigo.')] });
        }
    }
};
