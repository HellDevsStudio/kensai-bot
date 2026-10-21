const { SlashCommandBuilder } = require('discord.js');
const { criarEmbedPadrao, criarEmbedErro } = require('../../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('taxarobux')
        .setDescription('Calcula os 30% da taxa do Roblox para Gamepass e vendas.')
        .addIntegerOption(opt => opt.setName('valor').setDescription('Valor de Robux desejado').setRequired(true).setMinValue(1)),
    async execute(interaction) {
        const desejado = interaction.options.getInteger('valor');
        const recebeSeVender = Math.floor(desejado * 0.7);
        const precoNecessario = Math.ceil(desejado / 0.7);

        const embed = criarEmbedPadrao('🪙 Calculadora de Taxa Robux (30%)')
            .setDescription('Confira os valores calculados com base na taxa de 30% do Roblox:')
            .addFields(
                { name: '💰 Valor Desejado', value: `**${desejado.toLocaleString('pt-BR')}** Robux`, inline: false },
                { name: `📉 Se vender por ${desejado.toLocaleString('pt-BR')}, você recebe (70%):`, value: `**${recebeSeVender.toLocaleString('pt-BR')}** Robux`, inline: false },
                { name: '🏷️ Valor necessário na Gamepass para receber o valor desejado:', value: `**${precoNecessario.toLocaleString('pt-BR')}** Robux`, inline: false }
            );

        await interaction.reply({ embeds: [embed] });
    }
};
