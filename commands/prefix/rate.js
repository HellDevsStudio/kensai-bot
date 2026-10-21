const { criarEmbedPadrao } = require('../../utils/embeds');

module.exports = {
    name: 'rate',
    aliases: ['avaliar-algo', 'nota'],
    description: 'Dá uma nota de 0 a 100.',
    async execute(message, args) {
        const alvo = args.join(' ');
        if (!alvo) return message.reply('❌ Informe o que deseja avaliar. Ex: `k!rate café`');

        let hash = 0;
        for (let i = 0; i < alvo.length; i++) {
            hash = (hash * 31 + alvo.charCodeAt(i)) % 101;
        }
        const nota = Math.abs(hash);

        const embed = criarEmbedPadrao('📊 Avaliação do Ken')
            .setDescription('📊 Analisei **' + alvo + '** e minha nota final é: **' + nota + '/100**!');

        message.reply({ embeds: [embed] });
    }
};
