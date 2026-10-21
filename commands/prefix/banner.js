const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { criarEmbedPadrao, criarEmbedErro } = require('../../utils/embeds');

module.exports = {
    name: 'banner',
    description: 'Exibe a capa de perfil do usuário.',
    async execute(message, args) {
        const user = message.mentions.users.first() || message.author;
        const fetchedUser = await user.fetch({ force: true });
        const bannerUrl = fetchedUser.bannerURL({ dynamic: true, size: 1024 });

        if (!bannerUrl) {
            return message.reply({
                embeds: [criarEmbedErro('Sem Banner', `**${user.username}** não possui um banner personalizado.`)]
            });
        }

        const embed = criarEmbedPadrao(`🎨 Banner de ${user.username}`)
            .setImage(bannerUrl);

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setLabel('🔗 Abrir no Navegador')
                .setStyle(ButtonStyle.Link)
                .setURL(bannerUrl)
        );

        await message.reply({ embeds: [embed], components: [row] });
    }
};
