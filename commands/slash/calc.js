const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { criarEmbedPadrao, criarEmbedErro } = require('../../utils/embeds');
const { safeCalculate } = require('../../utils/mathParser');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('calc')
        .setDescription('Faz contas matemáticas na hora com segurança.')
        .addStringOption(opt => opt.setName('expressao').setDescription('Ex: 5x5, 20+20, 20/3, 1500 * 0.7').setRequired(true)),
    async execute(interaction) {
        const exp = interaction.options.getString('expressao');
        const res = safeCalculate(exp);

        if (res === null) {
            return interaction.reply({
                embeds: [criarEmbedErro('Expressão Inválida', 'Por favor, insira uma expressão matemática válida (ex: `5x5`, `20+20`, `20/3`, `1500 * 0.7`).')],
                flags: [MessageFlags.Ephemeral]
            });
        }

        const b = String.fromCharCode(96, 96, 96);
        const embed = criarEmbedPadrao('🧮 Calculadora Kensai')
            .addFields(
                { name: '📥 Expressão', value: b + '\n' + exp + '\n' + b },
                { name: '📤 Resultado', value: b + '\n' + res + '\n' + b }
            );

        await interaction.reply({ embeds: [embed] });
    }
};
