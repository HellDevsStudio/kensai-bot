const { PermissionsBitField } = require('discord.js');
const { NO_PERMISSION_MSG, checkPermission } = require('../../utils/permissions');
const { criarEmbedPadrao, criarEmbedErro } = require('../../utils/embeds');

module.exports = {
    name: 'lock',
    aliases: ['trancar'],
    description: 'Tranca o canal para envio de mensagens.',
    async execute(message) {
        if (!checkPermission(message.member, PermissionsBitField.Flags.ManageChannels)) {
            return message.reply(NO_PERMISSION_MSG);
        }

        const channel = message.mentions.channels.first() || message.channel;

        try {
            await channel.permissionOverwrites.edit(message.guild.roles.everyone, {
                SendMessages: false
            });

            const embed = criarEmbedPadrao(
                '🔒 Canal Trancado pela Staff',
                'O envio de mensagens neste canal foi desativado temporariamente pela moderação da Kensai Store.'
            ).setFooter({ text: 'Kensai Store • Segurança e Moderação' });

            await channel.send({ embeds: [embed] });
        } catch (error) {
            console.error('Erro no k!lock:', error);
            message.reply({ embeds: [criarEmbedErro('Erro ao Trancar Canal', 'Falta de permissão no canal.')] });
        }
    }
};
