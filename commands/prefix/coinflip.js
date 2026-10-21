const { AttachmentBuilder } = require('discord.js');
const path = require('path');
const fs = require('fs');
const { criarEmbedPadrao } = require('../../utils/embeds');

const GIF_PATH = path.resolve(__dirname, '../../kensai_assets/coinflip.gif');

module.exports = {
    name: 'coinflip',
    description: 'Gira uma moeda para cair Cara ou Coroa.',
    aliases: ['moeda', 'cf'],
    async execute(message, args) {
        const escolhaInput = args && args[0] ? args[0].toLowerCase() : null;
        let escolha = null;
        if (escolhaInput === 'cara' || escolhaInput === 'c') escolha = 'cara';
        if (escolhaInput === 'coroa' || escolhaInput === 'k') escolha = 'coroa';

        const hasGif = fs.existsSync(GIF_PATH);

        const spinEmbed = criarEmbedPadrao('🪙 Girando a Moeda...')
            .setDescription(escolha 
                ? `Você apostou em **${escolha.toUpperCase()}**!\nA moeda foi jogada para cima e está rodando...`
                : 'A moeda foi jogada para cima e está rodando no ar... Aguarde!');

        const replyPayload = { embeds: [spinEmbed] };
        if (hasGif) {
            spinEmbed.setImage('attachment://coinflip.gif');
            replyPayload.files = [new AttachmentBuilder(GIF_PATH, { name: 'coinflip.gif' })];
        }

        const msg = await message.reply(replyPayload);

        const resultado = Math.random() < 0.5 ? 'cara' : 'coroa';
        const resultadoNome = resultado === 'cara' ? 'CARA' : 'COROA';

        setTimeout(async () => {
            let desc = `A moeda girou, caiu na lâmina e deu: **${resultadoNome}**!`;
            if (escolha) {
                if (escolha === resultado) {
                    desc += `\n\n🎉 **Você venceu!** Apostou em **${escolha.toUpperCase()}** e acertou!`;
                } else {
                    desc += `\n\n💀 **Você perdeu!** Apostou em **${escolha.toUpperCase()}**, mas deu **${resultadoNome}**.`;
                }
            }

            const resultEmbed = criarEmbedPadrao('🪙 Resultado do Cara ou Coroa!')
                .setDescription(desc)
                .setFooter({ 
                    text: `Girada por ${message.author.username}`, 
                    iconURL: message.author.displayAvatarURL() 
                });

            const editPayload = { embeds: [resultEmbed] };
            if (hasGif) {
                resultEmbed.setImage('attachment://coinflip.gif');
                editPayload.files = [new AttachmentBuilder(GIF_PATH, { name: 'coinflip.gif' })];
            }

            await msg.edit(editPayload).catch(() => {});
        }, 1800);
    }
};
