const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { criarEmbedPadrao } = require('../../utils/embeds');

module.exports = {
    name: 'avatar',
    description: 'Exibe a foto de perfil do usuário.',
    async execute(message, args) {
        const user = message.mentions.users.first() || message.author;
        const avatarUrl = user.displayAvatarURL({ dynamic: true, size: 1024 });

        const embed = criarEmbedPadrao(`🖼️ Avatar de ${user.username}`)
            .setImage(avatarUrl);

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setLabel('🔗 Abrir no Navegador')
                .setStyle(ButtonStyle.Link)
                .setURL(avatarUrl)
        );

        await message.reply({ embeds: [embed], components: [row] });
    }
};
