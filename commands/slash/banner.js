const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { criarEmbedPadrao, criarEmbedErro } = require('../../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('banner')
        .setDescription('Exibe a capa de perfil (banner) do usuário.')
        .addUserOption(opt => opt.setName('usuario').setDescription('O membro a consultar').setRequired(false)),
    async execute(interaction) {
        const user = interaction.options.getUser('usuario') || interaction.user;
        const fetchedUser = await user.fetch({ force: true });
        const bannerUrl = fetchedUser.bannerURL({ dynamic: true, size: 1024 });

        if (!bannerUrl) {
            return interaction.reply({
                embeds: [criarEmbedErro('Sem Banner', `**${user.username}** não possui um banner personalizado.`)],
                ephemeral: true
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

        await interaction.reply({ embeds: [embed], components: [row] });
    }
};
