const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const { criarEmbedPadrao, criarEmbedErro } = require('../../utils/embeds');
const { getRoleplayGif } = require('../../utils/gifHelper');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('hug')
        .setDescription('Ação social de hug.')
        .addUserOption(opt => opt.setName('alvo').setDescription('Quem deseja interagir?').setRequired(true)),
    async execute(interaction) {
        const alvo = interaction.options.getUser('alvo');
        if (alvo.id === interaction.user.id) {
            return interaction.reply({
                embeds: [criarEmbedErro('Ação Inválida', 'Você não pode usar esta ação em você mesmo!')],
                flags: [MessageFlags.Ephemeral]
            });
        }

        const gifUrl = await getRoleplayGif('hug');

        const embed = criarEmbedPadrao('🤗 Um Abraço Quentinho!')
            .setDescription('🤗 **<@' + interaction.user.id + '>** abraçou **<@' + alvo.id + '>**!')
            .setImage(gifUrl)
            .setFooter({ text: 'Interação de ' + interaction.user.username, iconURL: interaction.user.displayAvatarURL() });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('rp_retribuir_hug_' + interaction.user.id + '_' + alvo.id)
                .setLabel('🔄 Retribuir')
                .setStyle(ButtonStyle.Primary)
        );

        await interaction.reply({ embeds: [embed], components: [row] });
    },
    async executeRetribuir(interaction, originalAuthorId) {
        const gifUrl = await getRoleplayGif('hug');

        const embed = criarEmbedPadrao('🤗 Retribuição!')
            .setDescription('🤗 **<@' + interaction.user.id + '>** retribuiu e abraçou **<@' + originalAuthorId + '>** de volta!')
            .setImage(gifUrl)
            .setFooter({ text: 'Retribuído por ' + interaction.user.username, iconURL: interaction.user.displayAvatarURL() });

        await interaction.reply({ embeds: [embed] });
    }
};
