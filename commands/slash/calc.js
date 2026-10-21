const { SlashCommandBuilder } = require('discord.js');
const { criarEmbedPadrao, criarEmbedErro } = require('../../utils/embeds');
const { safeCalculate } = require('../../utils/mathParser');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('calc')
        .setDescription('Faz contas matemáticas na hora com segurança.')
        .addStringOption(opt => opt.setName('expressao').setDescription('Ex: 1500 * 0.7 ou (50 + 20) / 2').setRequired(true)),
    async execute(interaction) {
        const exp = interaction.options.getString('expressao');
        const res = safeCalculate(exp);

        if (res === null) {
            return interaction.reply({
                embeds: [criarEmbedErro('Expressão Inválida', 'Por favor, insira uma expressão matemática válida com números e operadores básicos (+, -, *, /).')],
                ephemeral: true
            });
        }

        const embed = criarEmbedPadrao('🧮 Calculadora Kensai')
            .addFields(
                { name: '📥 Expressão', value: ```${exp}``` },
                { name: '📤 Resultado', value: ```${res}``` }
            );

        await interaction.reply({ embeds: [embed] });
    }
};
