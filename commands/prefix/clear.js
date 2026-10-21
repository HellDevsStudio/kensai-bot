const { PermissionsBitField } = require('discord.js');
const { NO_PERMISSION_MSG, checkPermission } = require('../../utils/permissions');
const { criarEmbedPadrao, criarEmbedErro } = require('../../utils/embeds');

module.exports = {
    name: 'clear',
    aliases: ['limpar', 'purge'],
    description: 'Limpa mensagens do chat.',
    async execute(message, args) {
        if (!checkPermission(message.member, PermissionsBitField.Flags.ManageMessages)) {
            return message.reply(NO_PERMISSION_MSG);
        }

        const amount = parseInt(args[0], 10);
        if (isNaN(amount) || amount < 1 || amount > 100) {
            return message.reply('❌ Por favor, informe uma quantidade válida entre 1 e 100. Ex: `k!clear 50`');
        }

        const targetUser = message.mentions.users.first();

        // Tentar apagar o comando original
        await message.delete().catch(() => {});

        try {
            const fetched = await message.channel.messages.fetch({ limit: targetUser ? 100 : amount });
            let toDelete = fetched;
            if (targetUser) {
                toDelete = fetched.filter(m => m.author.id === targetUser.id);
                toDelete = Array.from(toDelete.values()).slice(0, amount);
            }

            const deleted = await message.channel.bulkDelete(toDelete, true);
            const count = deleted.size;

            const tempMsg = await message.channel.send({
                embeds: [
                    criarEmbedPadrao(
                        '🧹 Limpeza Realizada',
                        `**${count}** mensagens foram cortadas deste canal por ${message.author}.`
                    )
                ]
            }).catch(() => null);

            if (tempMsg) {
                setTimeout(() => tempMsg.delete().catch(() => {}), 5000);
            }
        } catch (error) {
            console.error('Erro no k!clear:', error);
            const err = await message.channel.send({
                embeds: [criarEmbedErro('Erro na Limpeza', 'Não foi possível apagar mensagens com mais de 14 dias ou faltam permissões.')]
            }).catch(() => null);
            if (err) setTimeout(() => err.delete().catch(() => {}), 5000);
        }
    }
};
