const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { criarEmbedPadrao, criarEmbedErro } = require('../../utils/embeds');
const { getRoleplayGif } = require('../../utils/gifHelper');

module.exports = {
    name: 'kiss',
    description: 'Ação de kiss.',
    async execute(message, args) {
        const alvo = message.mentions.users.first();
        if (!alvo || alvo.id === message.author.id) {
            return message.reply({ embeds: [criarEmbedErro('Uso Correto', 'Mencione alguém diferente de você: `k!kiss @usuario`')] });
        }

        const gifUrl = await getRoleplayGif('kiss');

        const embed = criarEmbedPadrao('💋 Um Beijo Especial!')
            .setDescription('💋 **<@' + message.author.id + '>** beijou **<@' + alvo.id + '>**!')
            .setImage(gifUrl)
            .setFooter({ text: 'Interação de ' + message.author.username, iconURL: message.author.displayAvatarURL() });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('rp_retribuir_kiss_' + message.author.id + '_' + alvo.id)
                .setLabel('🔄 Retribuir')
                .setStyle(ButtonStyle.Primary)
        );

        await message.reply({ embeds: [embed], components: [row] });
    }
};
