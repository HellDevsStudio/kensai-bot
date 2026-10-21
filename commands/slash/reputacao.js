const { SlashCommandBuilder } = require('discord.js');
const { criarEmbedPadrao } = require('../../utils/embeds');
const { readData } = require('../../utils/db');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('reputacao')
        .setDescription('Consulta a reputação e avaliações de um membro/staff.')
        .addUserOption(opt => opt.setName('usuario').setDescription('O membro a consultar').setRequired(false)),
    async execute(interaction) {
        const target = interaction.options.getUser('usuario') || interaction.user;
        const repData = readData('reputacao', {});
        const userRep = repData[target.id] || { points: 0, reviews: [] };

        const totalReviews = userRep.reviews.length;
        const media = totalReviews > 0 ? (userRep.points / totalReviews).toFixed(1) : '5.0';

        const embed = criarEmbedPadrao(`⭐ Ficha de Reputação — ${target.username}`)
            .setThumbnail(target.displayAvatarURL())
            .addFields(
                { name: '🏆 Pontos Totais', value: ```${userRep.points} pts```, inline: true },
                { name: '📊 Total de Avaliações', value: ```${totalReviews} avaliações```, inline: true },
                { name: '⭐ Média Geral', value: ```${media} / 5.0```, inline: true }
            );

        if (totalReviews > 0) {
            const ultimas = userRep.reviews.slice(-3).reverse().map(r => `⭐ **${r.nota}/5** por <@${r.authorId}>: *"${r.comentario}"*`).join('\n');
            embed.addFields({ name: 'Últimos Depoimentos', value: ultimas });
        } else {
            embed.setDescription('Este membro ainda não possui avaliações registradas.');
        }

        await interaction.reply({ embeds: [embed] });
    }
};
