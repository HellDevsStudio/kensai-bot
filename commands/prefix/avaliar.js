const { criarEmbedPadrao, criarEmbedErro } = require('../../utils/embeds');
const { readData, writeData } = require('../../utils/db');

module.exports = {
    name: 'avaliar',
    description: 'Avalia o atendimento de um staff.',
    async execute(message, args) {
        const staff = message.mentions.users.first();
        const nota = parseInt(args[1], 10);
        const comentario = args.slice(2).join(' ');

        if (!staff || isNaN(nota) || nota < 1 || nota > 5 || !comentario) {
            return message.reply({ embeds: [criarEmbedErro('Uso Correto', 'Use: `k!avaliar [@staff] [nota 1-5] [comentário]`')] });
        }

        if (staff.id === message.author.id) {
            return message.reply({ embeds: [criarEmbedErro('Inválido', 'Você não pode avaliar a si mesmo!')] });
        }

        const estrelas = '⭐'.repeat(nota) + '☆'.repeat(5 - nota);

        const repData = readData('reputacao', {});
        repData[staff.id] = repData[staff.id] || { points: 0, reviews: [] };
        repData[staff.id].points += nota;
        repData[staff.id].reviews.push({
            authorId: message.author.id,
            authorTag: message.author.tag,
            nota: nota,
            comentario: comentario,
            date: Date.now()
        });
        writeData('reputacao', repData);

        const embed = criarEmbedPadrao('🌟 Nova Avaliação de Atendimento!')
            .setThumbnail(message.author.displayAvatarURL())
            .addFields(
                { name: '👤 Cliente', value: `<@${message.author.id}>`, inline: true },
                { name: '🛡️ Atendente / Vendedor', value: `<@${staff.id}>`, inline: true },
                { name: '⭐ Nota', value: `**${estrelas}** (${nota}/5)`, inline: true },
                { name: '💬 Depoimento', value: `> ${comentario}` }
            );

        const canalAvaliacoes = message.guild.channels.cache.find(c => c.name.includes('avalia') || c.name.includes('feedbacks'));
        const canalAlvo = canalAvaliacoes || message.channel;

        await canalAlvo.send({ embeds: [embed] });
        message.delete().catch(() => {});
    }
};
