const { SlashCommandBuilder } = require('discord.js');

const ASCII_MAP = {
    'A': [' █▀█ ', ' █▀█ '], 'B': [' █▀▄ ', ' █▄▀ '], 'C': [' █▀▀ ', ' █▄▄ '],
    'D': [' █▀▄ ', ' █▄▀ '], 'E': [' █▀▀ ', ' ██▄ '], 'F': [' █▀▀ ', ' █▀  '],
    'G': [' █▀▀ ', ' █▄█ '], 'H': [' █ █ ', ' █▀█ '], 'I': ['  █  ', '  █  '],
    'J': ['   █ ', ' ▀▄█ '], 'K': [' █▄▀ ', ' █ █ '], 'L': [' █   ', ' █▄▄ '],
    'M': [' █▀▄▀█ ', ' █ ▀ █ '], 'N': [' █▀▀█ ', ' █  █ '], 'O': [' █▀█ ', ' █▄█ '],
    'P': [' █▀█ ', ' █▀▀ '], 'Q': [' █▀█ ', ' ▀▀█ '], 'R': [' █▀█ ', ' █▀▄ '],
    'S': [' █▀▀ ', ' ▄▄█ '], 'T': [' ▀█▀ ', '  █  '], 'U': [' █ █ ', ' █▄█ '],
    'V': [' █ █ ', '  ▀  '], 'W': [' █ █ █ ', ' ▀▄▀▄▀ '], 'X': [' ▀▄▀ ', ' █ █ '],
    'Y': [' ▀▄▀ ', '  █  '], 'Z': [' ▀▀█ ', ' █▄▄ '], ' ': ['   ', '   '],
    '0': [' █▀█ ', ' █▄█ '], '1': ['  █  ', '  █  '], '2': [' ▀▀█ ', ' █▄▄ '],
    '3': [' ▀▀█ ', ' ▄▄█ '], '4': [' █ █ ', ' ▀▀█ '], '5': [' █▀▀ ', ' ▄▄█ '],
    '6': [' █▀▀ ', ' █▄█ '], '7': [' ▀▀█ ', '   █ '], '8': [' █▀█ ', ' █▄█ '],
    '9': [' █▀█ ', ' ▀▀█ '], '!': [' █ ', ' ▄ '], '?': [' ▀█ ', '  ▄ ']
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

        const ticks = String.fromCharCode(96, 96, 96);
        const banner = ticks + '\n' + line1 + '\n' + line2 + '\n' + ticks;
        await interaction.reply({ content: banner });
    }
};
