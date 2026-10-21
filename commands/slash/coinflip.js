const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const path = require('path');
const fs = require('fs');
const { criarEmbedPadrao } = require('../../utils/embeds');

const GIF_PATH = path.resolve(__dirname, '../../kensai_assets/coinflip.gif');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('coinflip')
        .setDescription('Gira uma moeda para cair Cara ou Coroa.')
        .addStringOption(option =>
            option.setName('escolha')
                .setDescription('Sua aposta: Cara ou Coroa (opcional)')
                .addChoices(
                    { name: '🪙 Cara', value: 'cara' },
                    { name: '👑 Coroa', value: 'coroa' }
                )
        ),
    async execute(interaction) {
        const escolha = interaction.options ? interaction.options.getString('escolha') : null;
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

        await interaction.reply(replyPayload);

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
                    text: `Girada por ${interaction.user.username}`, 
                    iconURL: interaction.user.displayAvatarURL() 
                });

            const editPayload = { embeds: [resultEmbed] };
            if (hasGif) {
                resultEmbed.setImage('attachment://coinflip.gif');
                editPayload.files = [new AttachmentBuilder(GIF_PATH, { name: 'coinflip.gif' })];
            }

            await interaction.editReply(editPayload).catch(() => {});
        }, 1800);
    }
};
