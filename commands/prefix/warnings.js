const { PermissionsBitField } = require('discord.js');
const { NO_PERMISSION_MSG, checkPermission } = require('../../utils/permissions');
const { readData } = require('../../utils/db');
const { criarEmbedPadrao } = require('../../utils/embeds');

module.exports = {
    name: 'warnings',
    aliases: ['avisos', 'historico'],
    description: 'Consulta o histórico de advertências de um membro.',
    async execute(message, args, client) {
        if (!checkPermission(message.member, PermissionsBitField.Flags.ModerateMembers)) {
            return message.reply(NO_PERMISSION_MSG);
        }

        const targetArg = args[0];
        const targetId = targetArg ? targetArg.replace(/[^0-9]/g, '') : message.author.id;
        const targetUser = await client.users.fetch(targetId).catch(() => null);
        if (!targetUser) {
            return message.reply('❌ Usuário não encontrado.');
        }

        const warnsDb = readData('warns', {});
        const userWarns = warnsDb[targetUser.id] || [];

        if (userWarns.length === 0) {
            return message.reply({
                embeds: [criarEmbedPadrao('📜 Histórico Limpo', `O usuário ${targetUser} não possui nenhuma advertência registrada.`)]
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

        message.reply({ embeds: [embed] });
    }
};
