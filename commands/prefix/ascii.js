const slashAscii = require('../slash/ascii');

module.exports = {
    name: 'ascii',
    description: 'Gera banner ASCII.',
    async execute(message, args) {
        const texto = (args.join(' ') || 'KEN').toUpperCase().slice(0, 8);
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
        let l1 = '', l2 = '';
        for (const char of texto) {
            const art = ASCII_MAP[char] || [' █ ', ' █ '];
            l1 += art[0]; l2 += art[1];
        }
        await message.reply(```
${l1}
${l2}
```);
    }
};
