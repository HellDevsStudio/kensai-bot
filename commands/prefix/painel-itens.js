const { PermissionsBitField } = require('discord.js');
const { checkPermission, NO_PERMISSION_MSG } = require('../../utils/permissions');
const { gerarPainelItensPayload } = require('../../utils/renderItensPanel');

module.exports = {
    name: 'painel-itens',
    description: 'Envia o painel de encomendas de itens (Espadas, Emotes, Explosões).',
    aliases: ['painelitens', 'arsenal', 'painel-arsenal'],
    async execute(message, args) {
        if (!checkPermission(message.member, PermissionsBitField.Flags.Administrator)) {
            return message.reply(NO_PERMISSION_MSG);
        }

        const payload = gerarPainelItensPayload(message.guild);
        await message.channel.send(payload);
        if (message.deletable) {
            await message.delete().catch(() => {});
        }
    }
};
