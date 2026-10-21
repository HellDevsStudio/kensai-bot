const { PermissionsBitField } = require('discord.js');
const { NO_PERMISSION_MSG, checkPermission } = require('../../utils/permissions');
const { criarEmbedPadrao, criarEmbedErro } = require('../../utils/embeds');

module.exports = {
    name: 'slowmode',
    aliases: ['modolento'],
    description: 'Configura o modo lento do canal.',
    async execute(message, args) {
        if (!checkPermission(message.member, PermissionsBitField.Flags.ManageChannels)) {
            return message.reply(NO_PERMISSION_MSG);
        }

        const seconds = parseInt(args[0], 10);
        if (isNaN(seconds) || seconds < 0 || seconds > 21600) {
            return message.reply('❌ Informe um número válido de segundos entre 0 e 21600. Ex: `k!slowmode 5`');
        }

        try {
            await message.channel.setRateLimitPerUser(seconds);
            const msg = seconds === 0
                ? '⏱️ Modo lento deste canal foi **desativado**.'
                : `⏱️ Modo lento deste canal ajustado para **${seconds}** segundos.`;

            message.reply({
                embeds: [criarEmbedPadrao('⏱️ Modo Lento Atualizado', msg)]
            });
        } catch (error) {
            console.error('Erro no k!slowmode:', error);
            message.reply({ embeds: [criarEmbedErro('Erro no Slowmode', 'Falha ao alterar o modo lento.')] });
        }
    }
};
