const { PermissionsBitField } = require('discord.js');
const { NO_PERMISSION_MSG, checkPermission } = require('../../utils/permissions');
const { criarEmbedPadrao, criarEmbedErro } = require('../../utils/embeds');

module.exports = {
    name: 'unlock',
    aliases: ['destrancar'],
    description: 'Destranca o canal para envio de mensagens.',
    async execute(message) {
        if (!checkPermission(message.member, PermissionsBitField.Flags.ManageChannels)) {
            return message.reply(NO_PERMISSION_MSG);
        }

        const channel = message.mentions.channels.first() || message.channel;

        try {
            await channel.permissionOverwrites.edit(message.guild.roles.everyone, {
                SendMessages: null
            });

            const embed = criarEmbedPadrao(
                '🔓 Canal Destrancado!',
                'O envio de mensagens neste canal foi reativado. Boas conversas a todos!'
            ).setFooter({ text: 'Kensai Store • Segurança e Moderação' });

            await channel.send({ embeds: [embed] });
        } catch (error) {
            console.error('Erro no k!unlock:', error);
            message.reply({ embeds: [criarEmbedErro('Erro ao Destrancar Canal', 'Falta de permissão no canal.')] });
        }
    }
};
