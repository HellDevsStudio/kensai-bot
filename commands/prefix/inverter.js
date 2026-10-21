module.exports = {
    name: 'inverter',
    description: 'Inverte o texto.',
    async execute(message, args) {
        const texto = args.join(' ');
        if (!texto) return message.reply('❌ Insira um texto para inverter!');
        const invertido = texto.split('').reverse().join('').replace(/@/g, '@​');
        await message.reply({
            content: `🙃 **Texto invertido:**\n> ${invertido}`,
            allowedMentions: { parse: [] }
        });
    }
};
