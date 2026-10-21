const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { criarEmbedPadrao, criarEmbedErro } = require('../../utils/embeds');
const { getRoleplayGif } = require('../../utils/gifHelper');

module.exports = {
    name: 'pat',
    description: 'Ação de pat.',
    async execute(message, args) {
        const alvo = message.mentions.users.first();
        if (!alvo || alvo.id === message.author.id) {
            return message.reply({ embeds: [criarEmbedErro('Uso Correto', 'Mencione alguém diferente de você: `k!pat @usuario`')] });
        }

        const gifUrl = await getRoleplayGif('pat');

        const embed = criarEmbedPadrao('💆 Cafuné & Carinho!')
            .setDescription('💆 **<@' + message.author.id + '>** fez carinho em **<@' + alvo.id + '>**!')
            .setImage(gifUrl)
            .setFooter({ text: 'Interação de ' + message.author.username, iconURL: message.author.displayAvatarURL() });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('rp_retribuir_pat_' + message.author.id + '_' + alvo.id)
                .setLabel('🔄 Retribuir')
                .setStyle(ButtonStyle.Primary)
        );

        await message.reply({ embeds: [embed], components: [row] });
    }
};
