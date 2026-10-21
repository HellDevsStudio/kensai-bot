const { SlashCommandBuilder } = require('discord.js');
const { criarEmbedPadrao, criarEmbedErro } = require('../../utils/embeds');
const { translateText } = require('../../utils/translator');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('traduzir')
        .setDescription('Traduz frases entre diversos idiomas de forma inteligente.')
        .addStringOption(opt =>
            opt.setName('idioma')
                .setDescription('Idioma destino (ex: en, pt, es, ja, fr, ingles, espanhol)')
                .setRequired(true)
        )
        .addStringOption(opt =>
            opt.setName('texto')
                .setDescription('Texto que deseja traduzir')
                .setRequired(true)
        ),
    async execute(interaction) {
        const targetInput = interaction.options.getString('idioma');
        const text = interaction.options.getString('texto');

        await interaction.deferReply();

        const result = await translateText(text, targetInput);

        const embed = criarEmbedPadrao('🌐 Tradutor Kensai')
            .addFields(
                { name: '📝 Texto Original', value: text.slice(0, 1024) },
                { name: '✨ Tradução (' + result.target.toUpperCase() + ')', value: result.text.slice(0, 1024) }
            )
            .setFooter({
                text: result.success ? 'Powered by Google Translate & MyMemory' : 'Aviso: Não foi possível conectar ao servidor de tradução',
                iconURL: 'https://upload.wikimedia.org/wikipedia/commons/d/d7/Google_Translate_logo.svg'
            });

        await interaction.editReply({ embeds: [embed] });
    }
};
