const { SlashCommandBuilder, PermissionsBitField, MessageFlags } = require('discord.js');
const { NO_PERMISSION_MSG, checkPermission } = require('../../utils/permissions');
const { gerarPainelPrincipal } = require('../../utils/configDashboard');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('config')
        .setDescription('Abre o Painel Central de Configuração da Kensai Store.'),
    async execute(interaction) {
        if (!checkPermission(interaction.member, PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ content: NO_PERMISSION_MSG, flags: [MessageFlags.Ephemeral] });
        }
        const payload = gerarPainelPrincipal();
        return interaction.reply({ ...payload, flags: [MessageFlags.Ephemeral] });
    }
};
