const { SlashCommandBuilder } = require('discord.js');
const { criarEmbedPadrao, criarEmbedErro } = require('../../utils/embeds');
const { readData, writeData } = require('../../utils/db');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('avaliar')
        .setDescription('Deixe sua avaliação e nota para um membro da Staff.')
        .addUserOption(opt => opt.setName('staff').setDescription('Vendedor ou staff responsável').setRequired(true))
        .addIntegerOption(opt => opt.setName('nota').setDescription('Nota de 1 a 5 estrelas').setRequired(true).setMinValue(1).setMaxValue(5))
        .addStringOption(opt => opt.setName('comentario').setDescription('Seu feedback sobre o atendimento').setRequired(true)),
    async execute(interaction) {
        const staff = interaction.options.getUser('staff');
        const nota = interaction.options.getInteger('nota');
        const comentario = interaction.options.getString('comentario');

        if (staff.id === interaction.user.id) {
            return interaction.reply({
                embeds: [criarEmbedErro('Avaliação Inválida', 'Você não pode avaliar a si mesmo!')],
                ephemeral: true
            });
        }

        const estrelas = '⭐'.repeat(nota) + '☆'.repeat(5 - nota);

        // Gravar no banco de reputação
        const repData = readData('reputacao', {});
        repData[staff.id] = repData[staff.id] || { points: 0, reviews: [] };
        repData[staff.id].points += nota;
        repData[staff.id].reviews.push({
            authorId: interaction.user.id,
            authorTag: interaction.user.tag,
            nota: nota,
            comentario: comentario,
            date: Date.now()
        });
        writeData('reputacao', repData);

        const embed = criarEmbedPadrao('🌟 Nova Avaliação de Atendimento!')
            .setThumbnail(interaction.user.displayAvatarURL())
            .addFields(
                { name: '👤 Cliente', value: `<@${interaction.user.id}>`, inline: true },
                { name: '🛡️ Atendente / Vendedor', value: `<@${staff.id}>`, inline: true },
                { name: '⭐ Nota', value: `**${estrelas}** (${nota}/5)`, inline: true },
                { name: '💬 Depoimento', value: `> ${comentario}` }
            )
            .setFooter({ text: 'Kensai Store — Transparência e Confiança' });

        const canalAvaliacoes = interaction.guild.channels.cache.find(c => c.name.includes('avalia') || c.name.includes('feedbacks'));
        const canalAlvo = canalAvaliacoes || interaction.channel;

        await canalAlvo.send({ embeds: [embed] });
        await interaction.reply({ content: '✅ Sua avaliação foi enviada com sucesso! Obrigado pelo feedback.', ephemeral: true });
    }
};
