const { criarEmbedPadrao, criarEmbedErro } = require('../../utils/embeds');

module.exports = {
    name: 'vouch',
    description: 'Confirmação rápida de entrega bem-sucedida.',
    async execute(message, args, client) {
        const targetUser = message.mentions.users.first();
        const produto = args.slice(1).join(' ');

        if (!targetUser || !produto) {
            return message.reply({
                embeds: [criarEmbedErro('Uso Incorreto', 'Uso: `k!vouch @vendedor [produto]`')]
            });
        }

        if (targetUser.id === message.author.id) {
            return message.reply({
                embeds: [criarEmbedErro('Inválido', 'Você não pode dar vouch para você mesmo!')]
            });
        }

        const embed = criarEmbedPadrao('🤝 Compra Confirmada (Vouch)')
            .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL() })
            .setDescription('✅ ' + message.author.toString() + ' confirmou uma compra bem-sucedida com ' + targetUser.toString() + '!\n\n📦 **Produto:** ' + produto)
            .setFooter({ text: 'Kensai Store — Garantia e Confiança' });

        message.reply({ embeds: [embed] });
    }
};
