const { SlashCommandBuilder, PermissionsBitField, MessageFlags } = require('discord.js');
const { NO_PERMISSION_MSG, checkPermission } = require('../../utils/permissions');
const { readData } = require('../../utils/db');
const { criarEmbedPadrao } = require('../../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warnings')
        .setDescription('Consulta o histórico de advertências de um membro.')
        .addUserOption(opt =>
            opt.setName('usuario')
                .setDescription('Membro a consultar')
                .setRequired(true)
        ),
    async execute(interaction) {
        if (!checkPermission(interaction.member, PermissionsBitField.Flags.ModerateMembers)) {
            return interaction.reply({ content: NO_PERMISSION_MSG, flags: [MessageFlags.Ephemeral] });
        }

        const targetUser = interaction.options.getUser('usuario');
        const warnsDb = readData('warns', {});
        const userWarns = warnsDb[targetUser.id] || [];

        if (userWarns.length === 0) {
            return interaction.reply({
                embeds: [criarEmbedPadrao('📜 Histórico Limpo', `O usuário ${targetUser} não possui nenhuma advertência registrada.`)],
                flags: [MessageFlags.Ephemeral]
            });
        }

        const embed = criarEmbedPadrao(`📜 Histórico de Advertências • ${targetUser.tag}`)
            .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
            .setDescription(`Total de Advertências acumuladas: **${userWarns.length}**`);

        userWarns.forEach((w, idx) => {
            embed.addFields({
                name: `#${idx + 1} • ID: ${w.id}`,
                value: `🛡️ **Staff:** ${w.staffTag}\\n📄 **Motivo:** ${w.reason}\\n📅 **Data:** <t:${Math.floor(w.timestamp / 1000)}:R>`,
                inline: false
            });
        });

        await interaction.reply({ embeds: [embed] });
    }
};
