const { SlashCommandBuilder } = require('discord.js');
const { criarEmbedPadrao } = require('../../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('coinflip')
        .setDescription('Gira uma moeda para cair Cara ou Coroa.'),
    async execute(interaction) {
        await interaction.reply('🪙 Girando a moeda no ar...');
        const resultado = Math.random() < 0.5 ? 'Cara' : 'Coroa';

        setTimeout(async () => {
            const embed = criarEmbedPadrao('🪙 Resultado do Cara ou Coroa!')
                .setDescription(`A moeda girou, caiu na lâmina e deu: **${resultado.toUpperCase()}**!`)
                .setFooter({ text: `Girada por ${interaction.user.username}` });

            await interaction.editReply({ content: null, embeds: [embed] });
        }, 1500);
    }
};
