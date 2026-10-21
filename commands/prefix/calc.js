const { criarEmbedPadrao, criarEmbedErro } = require('../../utils/embeds');
const { safeCalculate } = require('../../utils/mathParser');

module.exports = {
    name: 'calc',
    description: 'Faz contas matemáticas.',
    async execute(message, args) {
        const exp = args.join(' ');
        if (!exp) {
            return message.reply({ embeds: [criarEmbedErro('Uso Correto', 'Use: `k!calc [expressão]` (ex: `k!calc 1500 * 0.7`)')] });
        }

        const res = safeCalculate(exp);
        if (res === null) {
            return message.reply({
                embeds: [criarEmbedErro('Expressão Inválida', 'Insira uma expressão matemática válida.')]
            });
        }

        const embed = criarEmbedPadrao('🧮 Calculadora Kensai')
            .addFields(
                { name: '📥 Expressão', value: ```${exp}``` },
                { name: '📤 Resultado', value: ```${res}``` }
            );

        await message.reply({ embeds: [embed] });
    }
};
