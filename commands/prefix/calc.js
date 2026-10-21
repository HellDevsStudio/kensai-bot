const { criarEmbedPadrao, criarEmbedErro } = require('../../utils/embeds');
const { safeCalculate } = require('../../utils/mathParser');

module.exports = {
    name: 'calc',
    aliases: ['calcular', 'calculadora', 'conta'],
    description: 'Faz contas matemáticas.',
    async execute(message, args) {
        const exp = args.join(' ');
        if (!exp) {
            return message.reply({ embeds: [criarEmbedErro('Uso Correto', 'Use: `k!calc [expressão]` (ex: `k!calc 5x5`, `k!calc 20+20`)')] });
        }

        const res = safeCalculate(exp);
        if (res === null) {
            return message.reply({
                embeds: [criarEmbedErro('Expressão Inválida', 'Insira uma expressão matemática válida (ex: `5x5`, `20/3`, `1500 * 0.7`).')]
            });
        }

        const b = String.fromCharCode(96, 96, 96);
        const embed = criarEmbedPadrao('🧮 Calculadora Kensai')
            .addFields(
                { name: '📥 Expressão', value: b + '\n' + exp + '\n' + b },
                { name: '📤 Resultado', value: b + '\n' + res + '\n' + b }
            );

        await message.reply({ embeds: [embed] });
    }
};
