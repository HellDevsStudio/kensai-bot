const { criarEmbedPadrao } = require('../../utils/embeds');

module.exports = {
    name: 'coinflip',
    description: 'Gira uma moeda.',
    async execute(message) {
        const msg = await message.reply('🪙 Girando a moeda no ar...');
        const resultado = Math.random() < 0.5 ? 'Cara' : 'Coroa';

        setTimeout(async () => {
            const embed = criarEmbedPadrao('🪙 Resultado do Cara ou Coroa!')
                .setDescription(`A moeda girou e deu: **${resultado.toUpperCase()}**!`);
            await msg.edit({ content: null, embeds: [embed] });
        }, 1500);
    }
};
