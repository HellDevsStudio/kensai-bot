const { SlashCommandBuilder, PermissionsBitField, MessageFlags } = require('discord.js');
const { NO_PERMISSION_MSG, checkPermission } = require('../../utils/permissions');
const { readData, writeData } = require('../../utils/db');
const { criarEmbedPadrao, criarEmbedErro } = require('../../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unwarn')
        .setDescription('Apaga uma advertência específica da ficha de um membro.')
        .addUserOption(opt => opt.setName('usuario').setDescription('Membro que recebeu a advertência').setRequired(true))
        .addStringOption(opt => opt.setName('id_warn').setDescription('ID da advertência a remover').setRequired(true)),
    async execute(interaction) {
        if (!checkPermission(interaction.member, PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ content: NO_PERMISSION_MSG, flags: [MessageFlags.Ephemeral] });
        }

        const targetUser = interaction.options.getUser('usuario');
        const warnId = interaction.options.getString('id_warn').trim().toUpperCase();

        const warnsDb = readData('warns', {});
        let userWarns = warnsDb[targetUser.id] || [];

        const warnIndex = userWarns.findIndex(w => w.id === warnId);
        if (warnIndex === -1) {
            return interaction.reply({
                embeds: [criarEmbedErro('Aviso Não Encontrado', 'Nenhuma advertência com ID `' + warnId + '` foi encontrada para ' + targetUser.toString() + '.')],
                flags: [MessageFlags.Ephemeral]
            });
        }

        userWarns.splice(warnIndex, 1);
        warnsDb[targetUser.id] = userWarns;
        writeData('warns', warnsDb);

        const embed = criarEmbedPadrao(
            '✅ Advertência Removida',
            'A advertência com ID `' + warnId + '` foi removida com sucesso da ficha de ' + targetUser.toString() + '.'
        ).addFields(
            { name: '🛡️ Administrador Responsável', value: interaction.user.tag, inline: true },
            { name: '📊 Advertências Restantes', value: String(userWarns.length), inline: true }
        );

        await interaction.reply({ embeds: [embed] });
    }
};
