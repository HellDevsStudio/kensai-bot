module.exports = {
    name: 'hack',
    description: 'Hack fake na zoeira.',
    async execute(message, args) {
        const alvo = message.mentions.users.first() || message.author;
        const msg = await message.reply(`💻 [TERMINAL KENSAI] Invadindo ${alvo.username}...`);
        setTimeout(() => { msg.edit('```[50%] Quebrando senhas salvas...```').catch(() => {}); }, 1500);
        setTimeout(() => { msg.edit(```diff\n+ [100%] Invasão em ${alvo.username} concluída na zoeira!\n```).catch(() => {}); }, 3000);
    }
};
