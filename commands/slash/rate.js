const { SlashCommandBuilder } = require('discord.js');
const { criarEmbedPadrao } = require('../../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rate')
        .setDescription('Dá uma nota de 0 a 100 para algo ou alguém.')
        .addStringOption(opt => opt.setName('alvo').setDescription('O que ou quem avaliar').setRequired(true)),
    async execute(interaction) {
        const alvo = interaction.options.getString('alvo');
        let hash = 0;
        for (let i = 0; i < alvo.length; i++) {
            hash = (hash * 31 + alvo.charCodeAt(i)) % 101;
        }
        const nota = Math.abs(hash);

        const embed = criarEmbedPadrao('📊 Avaliação do Ken')
            .setDescription('📊 Analisei **' + alvo + '** e minha nota final é: **' + nota + '/100**!');

        await interaction.reply({ embeds: [embed] });
    }
};
