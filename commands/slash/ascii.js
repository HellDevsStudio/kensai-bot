const { SlashCommandBuilder } = require('discord.js');
const { criarEmbedErro } = require('../../utils/embeds');

const ASCII_MAP = {
    'A': [' █▀█ ', ' █▀█ '], 'B': [' █▀▄ ', ' █▄▀ '], 'C': [' █▀▀ ', ' █▄▄ '],
    'D': [' █▀▄ ', ' █▄▀ '], 'E': [' █▀▀ ', ' ██▄ '], 'F': [' █▀▀ ', ' █▀  '],
    'G': [' █▀▀ ', ' █▄█ '], 'H': [' █ █ ', ' █▀█ '], 'I': ['  █  ', '  █  '],
    'J': ['   █ ', ' ▀▄█ '], 'K': [' █▄▀ ', ' █ █ '], 'L': [' █   ', ' █▄▄ '],
    'M': [' █▀▄▀█ ', ' █ ▀ █ '], 'N': [' █▀▀█ ', ' █  █ '], 'O': [' █▀█ ', ' █▄█ '],
    'P': [' █▀█ ', ' █▀▀ '], 'Q': [' █▀█ ', ' ▀▀█ '], 'R': [' █▀█ ', ' █▀▄ '],
    'S': [' █▀▀ ', ' ▄▄█ '], 'T': [' ▀█▀ ', '  █  '], 'U': [' █ █ ', ' █▄█ '],
    'V': [' █ █ ', '  ▀  '], 'W': [' █ █ █ ', ' ▀▄▀▄▀ '], 'X': [' ▀▄▀ ', ' █ █ '],
    'Y': [' ▀▄▀ ', '  █  '], 'Z': [' ▀▀█ ', ' █▄▄ '], ' ': ['   ', '   ']
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ascii')
        .setDescription('Converte uma palavra curta em letras gigantes desenhadas em ASCII.')
        .addStringOption(opt => opt.setName('texto').setDescription('Palavra curta (máx 8 caracteres)').setRequired(true)),
    async execute(interaction) {
        const texto = interaction.options.getString('texto').toUpperCase().slice(0, 8);
        let line1 = '';
        let line2 = '';

        for (const char of texto) {
            const art = ASCII_MAP[char] || [' █ ', ' █ '];
            line1 += art[0];
            line2 += art[1];
        }

        const banner = ```
${line1}
${line2}
```;
        await interaction.reply(banner);
    }
};
