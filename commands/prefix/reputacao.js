const { criarEmbedPadrao } = require('../../utils/embeds');
const { readData } = require('../../utils/db');

module.exports = {
    name: 'reputacao',
    aliases: ['rep'],
    description: 'Consulta a reputação de um membro.',
    async execute(message, args) {
        const target = message.mentions.users.first() || message.author;
        const repData = readData('reputacao', {});
        const userRep = repData[target.id] || { points: 0, reviews: [] };

        const totalReviews = userRep.reviews.length;
        const media = totalReviews > 0 ? (userRep.points / totalReviews).toFixed(1) : '5.0';

        const embed = criarEmbedPadrao('⭐ Reputação — ' + target.username)
            .setThumbnail(target.displayAvatarURL())
            .addFields(
                { name: '🏆 Pontos', value: '`' + userRep.points + ' pts`', inline: true },
                { name: '📊 Avaliações', value: '`' + totalReviews + '`', inline: true },
                { name: '⭐ Média', value: '`' + media + ' / 5.0`', inline: true }
            );

        if (totalReviews > 0) {
            const ultimas = userRep.reviews.slice(-2).reverse().map(r => '⭐ ' + r.nota + '/5 por <@' + r.authorId + '>: *"' + r.comentario + '"*').join('\n');
            embed.addFields({ name: 'Últimas', value: ultimas });
        }

        await message.reply({ embeds: [embed] });
    }
};
