const { PermissionsBitField } = require('discord.js');
const { NO_PERMISSION_MSG, checkPermission } = require('../../utils/permissions');
const { gerarPainelPrincipal } = require('../../utils/configDashboard');

module.exports = {
    name: 'config',
    aliases: ['setup', 'painelconfig', 'h!config', 'hconfig'],
    description: 'Abre o Painel Central de Configuração da Kensai Store.',
    async execute(message, args) {
        if (!checkPermission(message.member, PermissionsBitField.Flags.Administrator)) {
            return message.reply(NO_PERMISSION_MSG);
        }
        const payload = gerarPainelPrincipal();
        return message.reply(payload);
    }
};
