const { SlashCommandBuilder, PermissionsBitField, MessageFlags } = require('discord.js');
const { NO_PERMISSION_MSG, checkPermission, checkHierarchy } = require('../../utils/permissions');
const { readData, writeData } = require('../../utils/db');
const { criarEmbedPadrao } = require('../../utils/embeds');
const crypto = require('crypto');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warn')
        .setDescription('Aplica uma advertência formal a um membro.')
        .addUserOption(opt => opt.setName('usuario').setDescription('Membro a advertir').setRequired(true))
        .addStringOption(opt => opt.setName('motivo').setDescription('Motivo da advertência').setRequired(true)),
    async execute(interaction) {
        if (!checkPermission(interaction.member, PermissionsBitField.Flags.ModerateMembers)) {
            return interaction.reply({ content: NO_PERMISSION_MSG, flags: [MessageFlags.Ephemeral] });
        }

        const targetUser = interaction.options.getUser('usuario');
        const reason = interaction.options.getString('motivo');

        const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
        if (targetMember && !checkHierarchy(interaction.member, targetMember)) {
            return interaction.reply({
                content: '❌ Você não pode advertir um membro com cargo superior ou igual ao seu!',
                flags: [MessageFlags.Ephemeral]
            });
        }

        const warnId = crypto.randomBytes(3).toString('hex').toUpperCase();
        const warnsDb = readData('warns', {});
        const userWarns = warnsDb[targetUser.id] || [];

        const newWarn = {
            id: warnId,
            guildId: interaction.guild.id,
            staffId: interaction.user.id,
            staffTag: interaction.user.tag,
            reason: reason,
            timestamp: Date.now()
        };

        userWarns.push(newWarn);
        warnsDb[targetUser.id] = userWarns;
        writeData('warns', warnsDb);

        const count = userWarns.length;

        await targetUser.send({
            embeds: [
                criarEmbedPadrao('⚠️ Advertência Recebida', 'Você recebeu uma advertência formal no servidor **' + interaction.guild.name + '**.')
                    .addFields(
                        { name: '🆔 ID do Aviso', value: '`' + warnId + '`', inline: true },
                        { name: '📊 Total de Advertências', value: 'Aviso ' + count + '/3', inline: true },
                        { name: '🛡️ Staff', value: interaction.user.tag, inline: true },
                        { name: '📄 Motivo', value: reason, inline: false }
                    )
            ]
        }).catch(() => {});

        const embed = criarEmbedPadrao('⚠️ Advertência Aplicada')
            .setDescription('O membro ' + targetUser.toString() + ' (`' + targetUser.id + '`) foi advertido formalmente.')
            .addFields(
                { name: '🆔 ID do Aviso', value: '`' + warnId + '`', inline: true },
                { name: '📊 Total de Advertências', value: 'Aviso ' + count + '/3', inline: true },
                { name: '🛡️ Staff Responsável', value: interaction.user.tag, inline: true },
                { name: '📄 Motivo', value: reason, inline: false }
            );

        await interaction.reply({ embeds: [embed] });
    }
};
