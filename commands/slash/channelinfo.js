const { SlashCommandBuilder } = require('discord.js');
const { criarEmbedPadrao } = require('../../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('channelinfo')
        .setDescription('Exibe dados técnicos sobre um canal de texto ou voz.')
        .addChannelOption(opt => opt.setName('canal').setDescription('Canal a consultar').setRequired(false)),
    async execute(interaction) {
        const channel = interaction.options.getChannel('canal') || interaction.channel;

        const embed = criarEmbedPadrao(`💬 Informações do Canal: #${channel.name}`)
            .addFields(
                { name: '🆔 ID', value: `\`${channel.id}\``, inline: true },
                { name: '📂 Categoria', value: channel.parent ? channel.parent.name : 'Nenhuma', inline: true },
                { name: '📅 Criado em', value: `<t:${Math.floor(channel.createdTimestamp / 1000)}:D>`, inline: true },
                { name: '📝 Tópico', value: channel.topic || 'Nenhum tópico definido.' }
            );

        await interaction.reply({ embeds: [embed] });
    }
};
