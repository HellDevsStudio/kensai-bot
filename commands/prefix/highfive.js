const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { criarEmbedPadrao, criarEmbedErro } = require('../../utils/embeds');
const { getRoleplayGif } = require('../../utils/gifHelper');

module.exports = {
    name: 'highfive',
    aliases: ['tocaqui', 'toca_aqui', 'toca'],
    description: 'Toca aqui / highfive com um amigo com GIF animado.',
    async execute(message, args) {
        const alvo = message.mentions.users.first();
        if (!alvo || alvo.id === message.author.id) {
            return message.reply({ embeds: [criarEmbedErro('Uso Correto', 'Mencione alguém diferente de você: `k!highfive @usuario`')] });
        }

        const gifUrl = await getRoleplayGif('highfive');

        const embed = criarEmbedPadrao('✋ Toca Aqui! High Five!')
            .setDescription('✋ **<@' + message.author.id + '>** tocou aqui com **<@' + alvo.id + '>**!')
            .setImage(gifUrl)
            .setFooter({ text: 'Interação de ' + message.author.username, iconURL: message.author.displayAvatarURL() });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('rp_retribuir_highfive_' + message.author.id + '_' + alvo.id)
                .setLabel('🔄 Tocar de Volta')
                .setStyle(ButtonStyle.Primary)
        );

        await message.reply({ embeds: [embed], components: [row] });
    }
};
