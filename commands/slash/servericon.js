const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { criarEmbedPadrao, criarEmbedErro } = require('../../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('servericon')
        .setDescription('Mostra a logo oficial da Kensai Store em alta definição.'),
    async execute(interaction) {
        const guild = interaction.guild;
        const iconUrl = guild.iconURL({ dynamic: true, size: 1024 });

        if (!iconUrl) {
            return interaction.reply({
                embeds: [criarEmbedErro('Sem Ícone', 'Este servidor não possui um ícone configurado.')],
                ephemeral: true
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

        await interaction.reply({ embeds: [embed], components: [row] });
    }
};
