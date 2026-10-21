const { PermissionsBitField } = require('discord.js');
const { NO_PERMISSION_MSG, checkPermission, checkHierarchy } = require('../../utils/permissions');
const { parseDuration, formatDuration } = require('../../utils/timeParser');
const { criarEmbedPadrao, criarEmbedErro } = require('../../utils/embeds');

module.exports = {
    name: 'timeout',
    aliases: ['mute', 'silenciar', 'castigo'],
    description: 'Silencia um membro temporariamente.',
    async execute(message, args) {
        if (!checkPermission(message.member, PermissionsBitField.Flags.ModerateMembers)) {
            return message.reply(NO_PERMISSION_MSG);
        }

        const targetArg = args[0];
        const timeStr = args[1];
        if (!targetArg || !timeStr) {
            return message.reply('❌ Uso correto: `k!mute [@user] [tempo] [motivo]`');
        }

        const durationMs = parseDuration(timeStr);
        if (!durationMs || durationMs < 5000 || durationMs > 28 * 24 * 60 * 60 * 1000) {
            return message.reply('❌ Duração inválida! Use até 28 dias (ex: `10m`, `2h`, `1d`).');
        }

        const targetId = targetArg.replace(/[^0-9]/g, '');
        const targetMember = await message.guild.members.fetch(targetId).catch(() => null);
        if (!targetMember) {
            return message.reply('❌ Membro não encontrado no servidor.');
        }

        if (!checkHierarchy(message.member, targetMember)) {
            return message.reply('❌ Você não pode silenciar um membro com cargo superior ou igual ao seu!');
        }

        if (!targetMember.moderatable) {
            return message.reply('❌ O Ken não tem permissão para silenciar este membro.');
        }

        const reason = args.slice(2).join(' ') || 'Motivo não especificado';

        try {
            await targetMember.timeout(durationMs, reason + ' (por ' + message.author.tag + ')');

            const embed = criarEmbedPadrao('🔇 Membro Silenciado (Castigo)')
                .addFields(
                    { name: '👤 Membro', value: targetMember.user.tag + ' (`' + targetMember.id + '`)', inline: true },
                    { name: '⏱️ Duração', value: formatDuration(durationMs), inline: true },
                    { name: '🛡️ Staff Responsável', value: message.author.tag, inline: true },
                    { name: '📄 Motivo', value: reason, inline: false },
                    { name: '📅 Expira em', value: '<t:' + Math.floor((Date.now() + durationMs) / 1000) + ':R>', inline: false }
                );

            message.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Erro no k!timeout:', error);
            message.reply({ embeds: [criarEmbedErro('Erro no Castigo', 'Não foi possível silenciar o membro.')] });
        }
    }
};
