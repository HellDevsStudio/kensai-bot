module.exports = {
    name: 'escolha',
    description: 'Escolhe entre opções.',
    async execute(message, args) {
        const opts = args.join(' ').split(',').map(o => o.trim()).filter(o => o.length > 0);
        if (opts.length < 2) return message.reply('❌ Forneça pelo menos 2 opções separadas por vírgula (ex: `k!escolha pizza, burguer`)');
        const sorteado = opts[Math.floor(Math.random() * opts.length)];
        await message.reply(`🤔 Entre essas opções, o **Ken** escolhe com certeza: **${sorteado}**!`);
    }
};
