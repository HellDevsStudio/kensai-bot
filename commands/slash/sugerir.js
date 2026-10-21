const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const { criarEmbedPadrao } = require('../../utils/embeds');
const { readData, writeData } = require('../../utils/db');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('sugerir')
        .setDescription('Envia uma sugestão de melhoria para a loja.')
        .addStringOption(opt => opt.setName('ideia').setDescription('Sua sugestão').setRequired(true)),
    async execute(interaction) {
        const ideia = interaction.options.getString('ideia');
        const sugId = Date.now().toString(36);

        const sugs = readData('sugestoes', {});
        sugs[sugId] = {
            authorId: interaction.user.id,
            authorTag: interaction.user.tag,
            ideia: ideia,
            upvotes: [],
            downvotes: [],
            createdAt: Date.now()
        };
        writeData('sugestoes', sugs);

        const embed = criarEmbedPadrao('💡 Nova Sugestão')
            .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
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

        // Tentar enviar no canal de sugestões ou no canal atual
        const canalSugestoes = interaction.guild.channels.cache.find(c => c.name.includes('sugest') || c.name.includes('sugestoes'));
        const canalAlvo = canalSugestoes || interaction.channel;

        await canalAlvo.send({ embeds: [embed], components: [row] });
        await interaction.reply({ content: '✅ Sua sugestão foi postada com sucesso!', flags: [MessageFlags.Ephemeral] });
    }
};
