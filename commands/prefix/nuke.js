const { PermissionsBitField, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { NO_PERMISSION_MSG, checkPermission } = require('../../utils/permissions');

module.exports = {
    name: 'nuke',
    aliases: ['reiniciarcanal'],
    description: 'Reinicia o canal atual recriando-o do zero.',
    async execute(message) {
        if (!checkPermission(message.member, PermissionsBitField.Flags.Administrator)) {
            return message.reply(NO_PERMISSION_MSG);
        }

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('nuke_confirm')
                .setLabel('⚠️ Sim, reiniciar canal!')
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId('nuke_cancel')
                .setLabel('❌ Cancelar')
                .setStyle(ButtonStyle.Secondary)
        );

        message.reply({
            content: '⚠️ **ATENÇÃO:** Esta ação apagará todas as mensagens e recriará o canal idêntico. Confirma?',
            components: [row]
        });
    }
};
