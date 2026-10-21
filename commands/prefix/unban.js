const { PermissionsBitField } = require('discord.js');
const { NO_PERMISSION_MSG, checkPermission } = require('../../utils/permissions');
const { criarEmbedPadrao, criarEmbedErro } = require('../../utils/embeds');

module.exports = {
    name: 'unban',
    description: 'Desbane um usuário pelo ID.',
    async execute(message, args) {
        if (!checkPermission(message.member, PermissionsBitField.Flags.BanMembers)) {
            return message.reply(NO_PERMISSION_MSG);
        }

        const targetId = (args[0] || '').replace(/[^0-9]/g, '');
        if (!targetId) {
            return message.reply('❌ Uso correto: `k!unban [ID] [motivo]`');
        }

        const reason = args.slice(1).join(' ') || 'Motivo não especificado';

        try {
            const banInfo = await message.guild.bans.fetch(targetId).catch(() => null);
            if (!banInfo) {
                return message.reply('❌ Este usuário não consta na lista de banidos do servidor.');
            }

            await message.guild.bans.remove(targetId, reason + ' (por ' + message.author.tag + ')');

            const embed = criarEmbedPadrao('🔓 Usuário Desbanido')
                .setDescription('O usuário **' + banInfo.user.tag + '** (`' + targetId + '`) teve seu acesso restaurado com sucesso.')
                .addFields(
                    { name: '🛡️ Staff Responsável', value: message.author.tag, inline: true },
                    { name: '📄 Motivo', value: reason, inline: true },
                    { name: '📅 Data', value: '<t:' + Math.floor(Date.now() / 1000) + ':F>', inline: false }
                );

            message.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Erro no k!unban:', error);
            message.reply({ embeds: [criarEmbedErro('Erro no Desbanimento', 'Não foi possível desbanir o usuário.')] });
        }
    }
};
