const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { criarEmbedPadrao, criarEmbedErro } = require('../../utils/embeds');

module.exports = {
    name: 'pat',
    description: 'Ação de pat.',
    async execute(message, args) {
        const alvo = message.mentions.users.first();
        if (!alvo || alvo.id === message.author.id) {
            return message.reply({ embeds: [criarEmbedErro('Uso Correto', 'Mencione alguém diferente de você: `k!pat @usuario`')] });
        }

        const embed = criarEmbedPadrao()
            .setDescription(`💆 **<@${message.author.id}>** fez um cafuné em **<@${alvo.id}>**!`)
            .setImage('https://media.giphy.com/media/5tmRHwTlHAA9WkVxTU/giphy.gif');

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('rp_retribuir_pat_' + message.author.id + '_' + alvo.id)
                .setLabel('🔄 Retribuir')
                .setStyle(ButtonStyle.Primary)
        );

        await message.reply({ embeds: [embed], components: [row] });
    }
};
