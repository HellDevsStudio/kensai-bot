const { SlashCommandBuilder } = require('discord.js');
const { criarEmbedPadrao } = require('../../utils/embeds');

const RESPOSTAS = [
    'Com certeza absoluta! ✨',
    'Minhas lâminas apontam que sim. 🗡️',
    'Sem dúvidas a respeito disso.',
    'É decididamente que sim.',
    'Você pode contar com isso.',
    'A resposta é nebulosa, tente novamente... 🔮',
    'Pergunte novamente mais tarde.',
    'Melhor não te dizer agora.',
    'Minha lâmina não consegue prever no momento.',
    'Concentre-se e pergunte outra vez.',
    'Não conte com isso. ❌',
    'Minha resposta é não.',
    'Minhas fontes de espada dizem que não.',
    'As perspectivas não são nada boas.',
    'Muito duvidoso...'
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('8ball')
        .setDescription('Responde sua pergunta com as profecias da bola mágica 8.')
        .addStringOption(opt => opt.setName('pergunta').setDescription('O que deseja perguntar?').setRequired(true)),
    async execute(interaction) {
        const pergunta = interaction.options.getString('pergunta');
        const resposta = RESPOSTAS[Math.floor(Math.random() * RESPOSTAS.length)];

        const embed = criarEmbedPadrao('🎱 Bola 8 Mística')
            .addFields(
                { name: '❓ Pergunta', value: `> ${pergunta}` },
                { name: '🔮 Resposta do Ken', value: `**${resposta}**` }
            );

        await interaction.reply({ embeds: [embed] });
    }
};
