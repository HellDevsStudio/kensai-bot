const { PermissionsBitField } = require('discord.js');
const { NO_PERMISSION_MSG, checkPermission } = require('../../utils/permissions');
const { criarEmbedPadrao, criarEmbedErro } = require('../../utils/embeds');

module.exports = {
    name: 'dm',
    aliases: ['msgdm', 'direct'],
    description: 'Envia mensagem na DM de um cliente.',
    async execute(message, args, client) {
        if (!checkPermission(message.member, PermissionsBitField.Flags.Administrator)) {
            return message.reply(NO_PERMISSION_MSG);
        }

        const targetArg = args[0];
        const text = args.slice(1).join(' ');

        if (!targetArg || !text) {
            return message.reply('❌ Uso correto: `k!dm [@user] [mensagem]`');
        }

        const targetId = targetArg.replace(/[^0-9]/g, '');
        const targetUser = await client.users.fetch(targetId).catch(() => null);
        if (!targetUser) {
            return message.reply('❌ Usuário não encontrado.');
        }

        const embed = criarEmbedPadrao('📬 Notificação Oficial • Kensai Store', text)
            .setFooter({ text: `Enviado por: ${message.author.tag} • Kensai Store Support` });

        try {
            await targetUser.send({ embeds: [embed] });
            message.reply(`✅ Mensagem enviada com sucesso para a DM de ${targetUser.tag}!`);
        } catch (error) {
            message.reply({
                embeds: [criarEmbedErro('DM Fechada', 'Não foi possível entregar a mensagem na DM do usuário.')]
            });
        }
    }
};
