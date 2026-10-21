const { PermissionsBitField } = require('discord.js');
const { NO_PERMISSION_MSG, checkPermission } = require('../../utils/permissions');
const { criarEmbedPadrao, criarEmbedErro } = require('../../utils/embeds');

module.exports = {
    name: 'role',
    aliases: ['cargo'],
    description: 'Adiciona ou remove cargo de um membro.',
    async execute(message, args) {
        if (!checkPermission(message.member, PermissionsBitField.Flags.ManageRoles)) {
            return message.reply(NO_PERMISSION_MSG);
        }

        const action = (args[0] || '').toLowerCase(); // add ou remove
        const targetArg = args[1];
        const roleArg = args[2];

        if (!['add', 'remove'].includes(action) || !targetArg || !roleArg) {
            return message.reply('❌ Uso correto: `k!role [add/remove] [@user] [@cargo]`');
        }

        const targetId = targetArg.replace(/[^0-9]/g, '');
        const roleId = roleArg.replace(/[^0-9]/g, '');

        const targetMember = await message.guild.members.fetch(targetId).catch(() => null);
        const role = await message.guild.roles.fetch(roleId).catch(() => null);

        if (!targetMember || !role) {
            return message.reply('❌ Membro ou cargo não encontrado.');
        }

        if (message.guild.ownerId !== message.author.id && role.position >= message.member.roles.highest.position) {
            return message.reply('❌ Você não pode gerenciar um cargo igual ou superior ao seu!');
        }

        try {
            if (action === 'add') {
                await targetMember.roles.add(role);
                const embed = criarEmbedPadrao('➕ Cargo Adicionado', `O cargo ${role} foi adicionado a ${targetMember} por ${message.author}.`);
                message.reply({ embeds: [embed] });
            } else {
                await targetMember.roles.remove(role);
                const embed = criarEmbedPadrao('➖ Cargo Removido', `O cargo ${role} foi removido de ${targetMember} por ${message.author}.`);
                message.reply({ embeds: [embed] });
            }
        } catch (error) {
            console.error('Erro no k!role:', error);
            message.reply({ embeds: [criarEmbedErro('Erro de Cargo', 'Falha ao alterar cargo.')] });
        }
    }
};
