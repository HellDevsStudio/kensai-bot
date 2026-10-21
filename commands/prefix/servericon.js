const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { criarEmbedPadrao, criarEmbedErro } = require('../../utils/embeds');

module.exports = {
    name: 'servericon',
    description: 'Mostra o ícone do servidor.',
    async execute(message) {
        const guild = message.guild;
        const iconUrl = guild.iconURL({ dynamic: true, size: 1024 });

        if (!iconUrl) {
            return message.reply({
                embeds: [criarEmbedErro('Sem Ícone', 'Este servidor não possui um ícone configurado.')]
            });
        }

        const embed = criarEmbedPadrao(`🏛️ Ícone de ${guild.name}`)
            .setImage(iconUrl);

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setLabel('🔗 Abrir no Navegador')
                .setStyle(ButtonStyle.Link)
                .setURL(iconUrl)
        );

        await message.reply({ embeds: [embed], components: [row] });
    }
};
