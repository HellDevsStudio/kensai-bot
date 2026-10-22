const { PermissionsBitField } = require('discord.js');
const { checkPermission, NO_PERMISSION_MSG } = require('../../utils/permissions');
const { gerarPainelCopyPayload } = require('../../utils/channelCloner');

module.exports = {
    name: 'copy',
    description: 'Abre o painel interativo de clonagem de canais e categorias.',
    aliases: ['clonar', 'copiar', 'clone', 'copychannel'],
    async execute(message, args) {
        if (!checkPermission(message.member, PermissionsBitField.Flags.ManageChannels)) {
            return message.reply(NO_PERMISSION_MSG);
        }

        const payload = gerarPainelCopyPayload();
        return message.reply(payload);
    }
};
