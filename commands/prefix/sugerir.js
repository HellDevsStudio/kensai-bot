const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { criarEmbedPadrao, criarEmbedErro } = require('../../utils/embeds');
const { readData, writeData } = require('../../utils/db');

module.exports = {
    name: 'sugerir',
    description: 'Envia uma sugestão.',
    async execute(message, args) {
        const ideia = args.join(' ');
        if (!ideia) {
            return message.reply({ embeds: [criarEmbedErro('Uso Correto', 'Use: `k!sugerir [sua ideia]`')] });
        }

        const sugId = Date.now().toString(36);
        const sugs = readData('sugestoes', {});
        sugs[sugId] = {
            authorId: message.author.id,
            authorTag: message.author.tag,
            ideia: ideia,
            upvotes: [],
            downvotes: [],
            createdAt: Date.now()
        };
        writeData('sugestoes', sugs);

        const embed = criarEmbedPadrao('💡 Nova Sugestão')
            .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL() })
            .setDescription(`> ${ideia}`)
            .setFooter({ text: `ID: ${sugId}` });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`sug_up_${sugId}`)
                .setLabel('Aprovar (0)')
                .setEmoji('✅')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId(`sug_down_${sugId}`)
                .setLabel('Recusar (0)')
                .setEmoji('❌')
                .setStyle(ButtonStyle.Danger)
        );

        const canalSugestoes = message.guild.channels.cache.find(c => c.name.includes('sugest') || c.name.includes('sugestoes'));
        const canalAlvo = canalSugestoes || message.channel;

        await canalAlvo.send({ embeds: [embed], components: [row] });
        message.delete().catch(() => {});
    }
};
