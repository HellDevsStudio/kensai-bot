const { criarEmbedPadrao } = require('../../utils/embeds');

module.exports = {
    name: 'roll',
    aliases: ['dado', 'roldado'],
    description: 'Rola um dado.',
    async execute(message, args) {
        let lados = parseInt(args[0], 10);
        if (isNaN(lados) || lados < 2) lados = 6;
        if (lados > 1000) lados = 1000;

        const resultado = Math.floor(Math.random() * lados) + 1;
        const embed = criarEmbedPadrao('🎲 Rolagem de Dado')
            .setDescription('🎲 ' + message.author.toString() + ' rolou um dado de **' + lados + '** lados e tirou **#' + resultado + '**!');

        message.reply({ embeds: [embed] });
    }
};
