const { criarEmbedPadrao, criarEmbedErro } = require('../../utils/embeds');
const slash8ball = require('../slash/8ball');

module.exports = {
    name: '8ball',
    description: 'Bola 8 mágica.',
    async execute(message, args) {
        const pergunta = args.join(' ');
        if (!pergunta) {
            return message.reply({ embeds: [criarEmbedErro('Uso Correto', 'Use: `k!8ball [pergunta]`')] });
        }
        const RESPOSTAS = [
            'Com certeza absoluta! ✨',
            'Minhas lâminas apontam que sim. 🗡️',
            'Sem dúvidas a respeito disso.',
            'A resposta é nebulosa, tente novamente... 🔮',
            'Não conte com isso. ❌',
            'Minha resposta é não.',
            'Muito duvidoso...'
        ];
        const resposta = RESPOSTAS[Math.floor(Math.random() * RESPOSTAS.length)];
        const embed = criarEmbedPadrao('🎱 Bola 8 Mística')
            .addFields(
                { name: '❓ Pergunta', value: `> ${pergunta}` },
                { name: '🔮 Resposta do Ken', value: `**${resposta}**` }
            );
        await message.reply({ embeds: [embed] });
    }
};
