const { criarEmbedPadrao } = require('../../utils/embeds');
const { readData, writeData } = require('../../utils/db');

module.exports = {
    name: 'afk',
    description: 'Ativa o modo ausente.',
    async execute(message, args) {
        const reason = args.join(' ') || 'Ausente';
        const afkData = readData('afk', {});

        afkData[message.author.id] = {
            reason: reason,
            timestamp: Date.now()
        };
        writeData('afk', afkData);

        const embed = criarEmbedPadrao(
            '💤 Modo AFK Ativado',
            `**${message.author.username}**, seu status AFK foi ativado com sucesso!\n📝 **Motivo:** ${reason}\n\n*Assim que você enviar uma mensagem no chat, seu AFK será removido automaticamente.*`.trim()
        );

        await message.reply({ embeds: [embed] });
    }
};
