const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { criarEmbedPadrao, criarEmbedErro } = require('../../utils/embeds');
const { getRoleplayGif } = require('../../utils/gifHelper');

module.exports = {
    name: 'slap',
    description: 'Ação de slap.',
    async execute(message, args) {
        const alvo = message.mentions.users.first();
        if (!alvo || alvo.id === message.author.id) {
            return message.reply({ embeds: [criarEmbedErro('Uso Correto', 'Mencione alguém diferente de você: `k!slap @usuario`')] });
        }

        const gifUrl = await getRoleplayGif('slap');

        const embed = criarEmbedPadrao('💥 Tapa na Cara!')
            .setDescription('💥 **<@' + message.author.id + '>** deu um tapa em **<@' + alvo.id + '>**!')
            .setImage(gifUrl)
            .setFooter({ text: 'Interação de ' + message.author.username, iconURL: message.author.displayAvatarURL() });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('rp_retribuir_slap_' + message.author.id + '_' + alvo.id)
                .setLabel('🔄 Retribuir')
                .setStyle(ButtonStyle.Primary)
        );

        await message.reply({ embeds: [embed], components: [row] });
    }
};
