const { SlashCommandBuilder, PermissionsBitField, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, MessageFlags } = require('discord.js');
const { NO_PERMISSION_MSG, checkPermission } = require('../../utils/permissions');
const { criarEmbedPadrao } = require('../../utils/embeds');
const config = require('../../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('embed')
        .setDescription('Cria um anúncio oficial com a estética da Kensai Store.'),
    async execute(interaction) {
        if (!checkPermission(interaction.member, PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ content: NO_PERMISSION_MSG, flags: [MessageFlags.Ephemeral] });
        }

        const modal = new ModalBuilder()
            .setCustomId('embed_builder_modal')
            .setTitle('Criar Embed • Kensai Store');

        const titleInput = new TextInputBuilder()
            .setCustomId('embed_title')
            .setLabel('Título da Embed')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Ex: Novidades na Loja!')
            .setRequired(true);

        const descInput = new TextInputBuilder()
            .setCustomId('embed_desc')
            .setLabel('Descrição da Mensagem')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('Escreva seu anúncio completo aqui...')
            .setRequired(true);

        const bannerInput = new TextInputBuilder()
            .setCustomId('embed_banner')
            .setLabel('URL da Imagem / Banner (Opcional)')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('https://...')
            .setRequired(false);

        const footerInput = new TextInputBuilder()
            .setCustomId('embed_footer')
            .setLabel('Texto do Rodapé (Opcional)')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Kensai Store • Qualidade e Confiança')
            .setRequired(false);

        modal.addComponents(
            new ActionRowBuilder().addComponents(titleInput),
            new ActionRowBuilder().addComponents(descInput),
            new ActionRowBuilder().addComponents(bannerInput),
            new ActionRowBuilder().addComponents(footerInput)
        );

        await interaction.showModal(modal);
    },
    async handleModal(interaction) {
        const title = interaction.fields.getTextInputValue('embed_title');
        const desc = interaction.fields.getTextInputValue('embed_desc');
        const banner = interaction.fields.getTextInputValue('embed_banner') || null;
        const footer = interaction.fields.getTextInputValue('embed_footer') || null;

        const embed = criarEmbedPadrao(title, desc);
        if (banner && (banner.startsWith('http://') || banner.startsWith('https://'))) {
            embed.setImage(banner);
        }
        if (footer) {
            embed.setFooter({ text: footer });
        }

        await interaction.channel.send({ embeds: [embed] });
        await interaction.reply({ content: '✅ Embed oficial postada com sucesso!', flags: [MessageFlags.Ephemeral] });
    }
};
