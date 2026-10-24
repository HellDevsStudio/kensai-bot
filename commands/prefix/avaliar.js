const { 
    identificarPartesTicket, 
    gerarPainelAvaliacaoPayload 
} = require('../../utils/avaliarCore');

module.exports = {
    name: 'avaliar',
    description: 'Solicita avaliação do atendimento ao cliente no ticket.',
    aliases: ['feedback', 'review'],
    async execute(message, args) {
        let staffId = null;
        let clienteId = null;

        const mentions = message.mentions.users;
        if (mentions.size === 1) {
            staffId = mentions.first().id;
        } else if (mentions.size >= 2) {
            const arr = Array.from(mentions.values());
            staffId = arr[0].id;
            clienteId = arr[1].id;
        }

        const partes = identificarPartesTicket(message.channel.id, message.channel, message.author);
        if (!staffId) staffId = partes.staffId || message.author.id;
        if (!clienteId) clienteId = partes.clienteId;

        const painel = gerarPainelAvaliacaoPayload({
            staffId,
            clienteId,
            guild: message.guild
        });

        await message.reply({
            embeds: painel.embeds,
            components: painel.components
        });
    }
};
