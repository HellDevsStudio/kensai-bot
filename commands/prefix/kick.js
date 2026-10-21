const { PermissionsBitField } = require('discord.js');
const { NO_PERMISSION_MSG, checkPermission, checkHierarchy } = require('../../utils/permissions');
const { criarEmbedPadrao, criarEmbedErro } = require('../../utils/embeds');

module.exports = {
    name: 'kick',
    description: 'Expulsa um membro do servidor.',
    async execute(message, args) {
        if (!checkPermission(message.member, PermissionsBitField.Flags.KickMembers)) {
            return message.reply(NO_PERMISSION_MSG);
        }

        const targetArg = args[0];
        if (!targetArg) {
            return message.reply('❌ Uso correto: `k!kick [@user] [motivo]`');
        }

        const targetId = targetArg.replace(/[^0-9]/g, '');
        const targetMember = await message.guild.members.fetch(targetId).catch(() => null);
        if (!targetMember) {
            return message.reply('❌ Membro não encontrado no servidor.');
        }

        if (!checkHierarchy(message.member, targetMember)) {
            return message.reply('❌ Você não pode expulsar um membro com cargo superior ou igual ao seu!');
        }

        if (!targetMember.kickable) {
            return message.reply('❌ O Ken não tem permissão para expulsar este membro.');
        }

        const reason = args.slice(1).join(' ') || 'Motivo não especificado';

        await targetMember.send({
            embeds: [
                criarEmbedPadrao(
                    '🥾 Você foi Expulso da Kensai Store',
                    'Você foi expulso do servidor **' + message.guild.name + '**.'
                ).addFields(
                    { name: '📄 Motivo', value: reason, inline: false },
                    { name: '🛡️ Staff Responsável', value: message.author.tag, inline: true }
                )
            ]
        }).catch(() => {});

        try {
            await targetMember.kick(reason + ' (por ' + message.author.tag + ')');

            const embed = criarEmbedPadrao('🥾 Membro Expulso')
                .addFields(
                    { name: '🥾 Usuário Expulso', value: targetMember.user.tag + ' (`' + targetMember.id + '`)', inline: true },
                    { name: '🛡️ Staff Responsável', value: message.author.tag, inline: true },
                    { name: '📄 Motivo', value: reason, inline: false },
                    { name: '📅 Data', value: '<t:' + Math.floor(Date.now() / 1000) + ':F>', inline: false }
                );

            message.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Erro no k!kick:', error);
            message.reply({ embeds: [criarEmbedErro('Erro na Expulsão', 'Não foi possível expulsar o membro.')] });
        }
    }
};
