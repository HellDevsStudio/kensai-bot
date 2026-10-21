const { PermissionsBitField } = require('discord.js');
const { NO_PERMISSION_MSG, checkPermission, checkHierarchy } = require('../../utils/permissions');
const { criarEmbedPadrao, criarEmbedErro } = require('../../utils/embeds');

module.exports = {
    name: 'ban',
    description: 'Bane um membro do servidor.',
    async execute(message, args, client) {
        if (!checkPermission(message.member, PermissionsBitField.Flags.BanMembers)) {
            return message.reply(NO_PERMISSION_MSG);
        }

        const targetArg = args[0];
        if (!targetArg) {
            return message.reply('❌ Uso correto: `k!ban [@user/ID] [motivo]`');
        }

        const targetId = targetArg.replace(/[^0-9]/g, '');
        const reason = args.slice(1).join(' ') || 'Motivo não especificado';

        const targetUser = await client.users.fetch(targetId).catch(() => null);
        if (!targetUser) {
            return message.reply('❌ Usuário não encontrado com o ID informado.');
        }

        const targetMember = await message.guild.members.fetch(targetId).catch(() => null);
        if (targetMember && !checkHierarchy(message.member, targetMember)) {
            return message.reply('❌ Você não pode banir um membro com cargo superior ou igual ao seu!');
        }

        if (targetMember && !targetMember.bannable) {
            return message.reply('❌ O Ken não tem permissão para banir este membro.');
        }

        await targetUser.send({
            embeds: [
                criarEmbedPadrao(
                    '🔨 Você foi Banido da Kensai Store',
                    'Você foi banido do servidor **' + message.guild.name + '**.'
                ).addFields(
                    { name: '📄 Motivo', value: reason, inline: false },
                    { name: '🛡️ Staff Responsável', value: message.author.tag, inline: true }
                )
            ]
        }).catch(() => {});

        try {
            await message.guild.members.ban(targetId, { reason: reason + ' (por ' + message.author.tag + ')' });
            const embed = criarEmbedPadrao('🔨 Usuário Banido')
                .addFields(
                    { name: '🔨 Usuário Banido', value: targetUser.tag + ' (`' + targetUser.id + '`)', inline: true },
                    { name: '🛡️ Staff Responsável', value: message.author.tag, inline: true },
                    { name: '📄 Motivo', value: reason, inline: false },
                    { name: '📅 Data', value: '<t:' + Math.floor(Date.now() / 1000) + ':F>', inline: false }
                );
            message.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Erro no k!ban:', error);
            message.reply({ embeds: [criarEmbedErro('Erro no Banimento', 'Falha ao executar o banimento.')] });
        }
    }
};
