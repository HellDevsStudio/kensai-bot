const { criarEmbedPadrao, criarEmbedErro } = require('../../utils/embeds');

module.exports = {
    name: 'roleinfo',
    description: 'Mostra detalhes sobre um cargo.',
    async execute(message, args) {
        const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[0]);
        if (!role) {
            return message.reply({ embeds: [criarEmbedErro('Cargo Inválido', 'Mencione um cargo ou forneça o ID dele.')] });
        }

        const hex = role.hexColor !== '#000000' ? role.hexColor : '#9a2ea6';
        const embed = criarEmbedPadrao(`🏷️ Informações do Cargo: ${role.name}`)
            .setColor(hex)
            .addFields(
                { name: '🆔 ID do Cargo', value: `\`${role.id}\``, inline: true },
                { name: '🎨 Cor HEX', value: `\`${role.hexColor}\``, inline: true },
                { name: '👥 Membros', value: `\`${role.members.size}\``, inline: true },
                { name: '📢 Mencionável?', value: role.mentionable ? 'Sim' : 'Não', inline: true },
                { name: '📅 Criado em', value: `<t:${Math.floor(role.createdTimestamp / 1000)}:D>`, inline: true }
            );

        await message.reply({ embeds: [embed] });
    }
};
