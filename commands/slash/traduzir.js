const { SlashCommandBuilder } = require('discord.js');
const { criarEmbedPadrao } = require('../../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('traduzir')
        .setDescription('Traduz frases entre idiomas.')
        .addStringOption(opt => opt.setName('idioma').setDescription('Idioma destino (ex: en, pt, es, ja, fr)').setRequired(true))
        .addStringOption(opt => opt.setName('texto').setDescription('Texto a traduzir').setRequired(true)),
    async execute(interaction) {
        const targetLang = interaction.options.getString('idioma').toLowerCase();
        const text = interaction.options.getString('texto');

        await interaction.deferReply();

        let translated = text;
        try {
            // Chamada à API pública de tradução gratuita
            const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURI(targetLang)}&dt=t&q=${encodeURIComponent(text)}`;
            const https = require('https');
            const data = await new Promise((resolve, reject) => {
                https.get(url, (res) => {
                    let d = '';
                    res.on('data', c => d += c);
                    res.on('end', () => resolve(JSON.parse(d)));
                }).on('error', reject);
            });
            if (data && data[0]) {
                translated = data[0].map(s => s[0]).join('');
            }
        } catch {
            translated = `[Simulação] ${text}`;
        }

        const embed = criarEmbedPadrao('🌐 Tradutor Kensai')
            .addFields(
                { name: '📝 Texto Original', value: text },
                { name: `✨ Tradução (${targetLang.toUpperCase()})`, value: translated }
            )
            .setFooter({ text: 'Powered by Google Translate', iconURL: 'https://upload.wikimedia.org/wikipedia/commons/d/d7/Google_Translate_logo.svg' });

        await interaction.editReply({ embeds: [embed] });
    }
};
