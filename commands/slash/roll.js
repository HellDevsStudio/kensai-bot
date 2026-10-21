const { SlashCommandBuilder } = require('discord.js');
const { criarEmbedPadrao } = require('../../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('roll')
        .setDescription('Rola um dado de quantos lados você escolher.')
        .addIntegerOption(opt => opt.setName('lados').setDescription('Número de lados do dado (padrão 6)').setMinValue(2).setMaxValue(1000).setRequired(false)),
    async execute(interaction) {
        const lados = interaction.options.getInteger('lados') || 6;
        const resultado = Math.floor(Math.random() * lados) + 1;

        const embed = criarEmbedPadrao('🎲 Rolagem de Dado')
            .setDescription('🎲 ' + interaction.user.toString() + ' rolou um dado de **' + lados + '** lados e tirou **#' + resultado + '**!');

        await interaction.reply({ embeds: [embed] });
    }
};
