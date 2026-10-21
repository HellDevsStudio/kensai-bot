const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { criarEmbedPadrao, criarEmbedErro } = require('../../utils/embeds');
const { getRoleplayGif } = require('../../utils/gifHelper');

module.exports = {
    name: 'hug',
    description: 'Ação de hug.',
    async execute(message, args) {
        const alvo = message.mentions.users.first();
        if (!alvo || alvo.id === message.author.id) {
            return message.reply({ embeds: [criarEmbedErro('Uso Correto', 'Mencione alguém diferente de você: `k!hug @usuario`')] });
        }

        const gifUrl = await getRoleplayGif('hug');

        const embed = criarEmbedPadrao('🤗 Um Abraço Quentinho!')
            .setDescription('🤗 **<@' + message.author.id + '>** abraçou **<@' + alvo.id + '>**!')
            .setImage(gifUrl)
            .setFooter({ text: 'Interação de ' + message.author.username, iconURL: message.author.displayAvatarURL() });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('rp_retribuir_hug_' + message.author.id + '_' + alvo.id)
                .setLabel('🔄 Retribuir')
                .setStyle(ButtonStyle.Primary)
        );

        await message.reply({ embeds: [embed], components: [row] });
    }
};
