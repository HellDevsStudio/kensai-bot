const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { criarEmbedPadrao, criarEmbedErro } = require('../../utils/embeds');

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
                ephemeral: true
            });
        }

        const embed = criarEmbedPadrao()
            .setDescription(`🤗 **<@${interaction.user.id}>** abraçou **<@${alvo.id}>**!`)
            .setImage('https://media.giphy.com/media/od5H3PmEG5EVq/giphy.gif');

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('rp_retribuir_hug_' + interaction.user.id + '_' + alvo.id)
                .setLabel('🔄 Retribuir')
                .setStyle(ButtonStyle.Primary)
        );

        await interaction.reply({ embeds: [embed], components: [row] });
    },
    async executeRetribuir(interaction, originalAuthorId) {
        const embed = criarEmbedPadrao()
            .setDescription(`🤗 **<@${interaction.user.id}>** retribuiu e abraçou **<@${originalAuthorId}>** de volta!`)
            .setImage('https://media.giphy.com/media/od5H3PmEG5EVq/giphy.gif');

        await interaction.reply({ embeds: [embed] });
    }
};
