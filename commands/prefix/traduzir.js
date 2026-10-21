const { criarEmbedPadrao, criarEmbedErro } = require('../../utils/embeds');
const { translateText } = require('../../utils/translator');

module.exports = {
    name: 'traduzir',
    aliases: ['translate', 'tr'],
    description: 'Traduz frases entre diversos idiomas.',
    async execute(message, args) {
        if (!args[0] || !args[1]) {
            return message.reply({
                embeds: [criarEmbedErro(
                    'Uso Correto do Tradutor',
                    'Use: `k!traduzir [idioma] [texto]`\n' +
                    'Exemplos:\n' +
                    '• `k!traduzir en Olá mundo, tudo bem?`\n' +
                    '• `k!traduzir pt Good morning everyone!`\n' +
                    '• `k!traduzir ja Obrigado pela compra!`'
                )]
            });
        }

        const targetInput = args[0];
        const text = args.slice(1).join(' ');

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

        await message.reply({ embeds: [embed] });
    }
};
