const { SlashCommandBuilder, PermissionsBitField, MessageFlags } = require('discord.js');
const { checkPermission, NO_PERMISSION_MSG } = require('../../utils/permissions');
const { gerarPainelCopyPayload } = require('../../utils/channelCloner');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('copy')
        .setDescription('Abre o painel interativo para clonar canais ou categorias com permissões idênticas.')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageChannels),
    async execute(interaction) {
        if (!checkPermission(interaction.member, PermissionsBitField.Flags.ManageChannels)) {
            return interaction.reply({ content: NO_PERMISSION_MSG, flags: [MessageFlags.Ephemeral] });
        }

        const payload = gerarPainelCopyPayload();
        return interaction.reply({
            ...payload,
            flags: [MessageFlags.Ephemeral]
        });
    }
};
