const { criarEmbedPadrao, criarEmbedErro } = require('../../utils/embeds');

module.exports = {
    name: 'tax',
    description: 'Calcula a taxa de 30% do Roblox.',
    async execute(message, args) {
        const desejado = parseInt(args[0], 10);
        if (isNaN(desejado) || desejado <= 0) {
            return message.reply({ embeds: [criarEmbedErro('Uso Correto', 'Use: `k!tax [valor]` (ex: `k!tax 1000`)')] });
        }

        const recebeSeVender = Math.floor(desejado * 0.7);
        const precoNecessario = Math.ceil(desejado / 0.7);

        const embed = criarEmbedPadrao('🪙 Calculadora de Taxa Robux (30%)')
            .setDescription('Confira os valores calculados com base na taxa de 30% do Roblox:')
            .addFields(
                { name: '💰 Valor Desejado', value: `**${desejado.toLocaleString('pt-BR')}** Robux`, inline: false },
                { name: `📉 Se vender por ${desejado.toLocaleString('pt-BR')}, você recebe (70%):`, value: `**${recebeSeVender.toLocaleString('pt-BR')}** Robux`, inline: false },
                { name: '🏷️ Valor necessário na Gamepass para receber o valor desejado:', value: `**${precoNecessario.toLocaleString('pt-BR')}** Robux`, inline: false }
            );

        await message.reply({ embeds: [embed] });
    }
};
