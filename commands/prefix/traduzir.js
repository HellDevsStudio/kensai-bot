const { criarEmbedPadrao, criarEmbedErro } = require('../../utils/embeds');

module.exports = {
    name: 'traduzir',
    description: 'Traduz frases.',
    async execute(message, args) {
        if (!args[0] || !args[1]) {
            return message.reply({ embeds: [criarEmbedErro('Uso Correto', 'Use: `k!traduzir [idioma] [texto]` (ex: `k!traduzir en Olá mundo`)')] });
        }

        const targetLang = args[0].toLowerCase();
        const text = args.slice(1).join(' ');

        let translated = text;
        try {
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
            translated = text;
        }

        const embed = criarEmbedPadrao('🌐 Tradutor Kensai')
            .addFields(
                { name: '📝 Texto Original', value: text },
                { name: `✨ Tradução (${targetLang.toUpperCase()})`, value: translated }
            )
            .setFooter({ text: 'Powered by Google Translate', iconURL: 'https://upload.wikimedia.org/wikipedia/commons/d/d7/Google_Translate_logo.svg' });

        await message.reply({ embeds: [embed] });
    }
};
