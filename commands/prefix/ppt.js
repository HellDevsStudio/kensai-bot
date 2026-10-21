const { criarEmbedErro } = require('../../utils/embeds');

module.exports = {
    name: 'ppt',
    description: 'Partida de Pedra, Papel e Tesoura.',
    async execute(message, args) {
        const oponente = message.mentions.users.first();
        if (!oponente) {
            return message.reply({ embeds: [criarEmbedErro('Uso Correto', 'Mencione um adversário: `k!ppt @usuario` ou use `/ppt` para botões!')] });
        }
        message.reply('💡 Para uma partida 100% interativa com botões secretos, use o comando slash: `/ppt @usuario`!');
    }
};
