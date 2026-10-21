const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { criarEmbedPadrao } = require('../../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('avatar')
        .setDescription('Exibe a foto de perfil do usuário em alta definição.')
        .addUserOption(opt => opt.setName('usuario').setDescription('O membro a consultar').setRequired(false)),
    async execute(interaction) {
        const user = interaction.options.getUser('usuario') || interaction.user;
        const avatarUrl = user.displayAvatarURL({ dynamic: true, size: 1024 });

        const embed = criarEmbedPadrao(`🖼️ Avatar de ${user.username}`)
            .setImage(avatarUrl);

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setLabel('🔗 Abrir no Navegador')
                .setStyle(ButtonStyle.Link)
                .setURL(avatarUrl)
        );

        await interaction.reply({ embeds: [embed], components: [row] });
    }
};
