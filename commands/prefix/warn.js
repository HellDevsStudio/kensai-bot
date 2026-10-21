const { PermissionsBitField } = require('discord.js');
const { NO_PERMISSION_MSG, checkPermission, checkHierarchy } = require('../../utils/permissions');
const { readData, writeData } = require('../../utils/db');
const { criarEmbedPadrao } = require('../../utils/embeds');
const crypto = require('crypto');

module.exports = {
    name: 'warn',
    aliases: ['advertir', 'aviso'],
    description: 'Aplica uma advertência formal a um membro.',
    async execute(message, args) {
        if (!checkPermission(message.member, PermissionsBitField.Flags.ModerateMembers)) {
            return message.reply(NO_PERMISSION_MSG);
        }

        const targetArg = args[0];
        const reason = args.slice(1).join(' ');
        if (!targetArg || !reason) {
            return message.reply('❌ Uso correto: `k!warn [@user] [motivo]`');
        }

        const targetId = targetArg.replace(/[^0-9]/g, '');
        const targetMember = await message.guild.members.fetch(targetId).catch(() => null);
        if (!targetMember) {
            return message.reply('❌ Membro não encontrado no servidor.');
        }

        if (!checkHierarchy(message.member, targetMember)) {
            return message.reply('❌ Você não pode advertir um membro com cargo superior ou igual ao seu!');
        }

        const warnId = crypto.randomBytes(3).toString('hex').toUpperCase();
        const warnsDb = readData('warns', {});
        const userWarns = warnsDb[targetMember.id] || [];

        const newWarn = {
            id: warnId,
            guildId: message.guild.id,
            staffId: message.author.id,
            staffTag: message.author.tag,
            reason: reason,
            timestamp: Date.now()
        };

        userWarns.push(newWarn);
        warnsDb[targetMember.id] = userWarns;
        writeData('warns', warnsDb);

        const count = userWarns.length;

        await targetMember.send({
            embeds: [
                criarEmbedPadrao('⚠️ Advertência Recebida', 'Você recebeu uma advertência formal no servidor **' + message.guild.name + '**.')
                    .addFields(
                        { name: '🆔 ID do Aviso', value: '`' + warnId + '`', inline: true },
                        { name: '📊 Total de Advertências', value: 'Aviso ' + count + '/3', inline: true },
                        { name: '🛡️ Staff', value: message.author.tag, inline: true },
                        { name: '📄 Motivo', value: reason, inline: false }
                    )
            ]
        }).catch(() => {});

        const embed = criarEmbedPadrao('⚠️ Advertência Aplicada')
            .setDescription('O membro ' + targetMember.toString() + ' (`' + targetMember.id + '`) foi advertido formalmente.')
            .addFields(
                { name: '🆔 ID do Aviso', value: '`' + warnId + '`', inline: true },
                { name: '📊 Total de Advertências', value: 'Aviso ' + count + '/3', inline: true },
                { name: '🛡️ Staff Responsável', value: message.author.tag, inline: true },
                { name: '📄 Motivo', value: reason, inline: false }
            );

        message.reply({ embeds: [embed] });
    }
};
