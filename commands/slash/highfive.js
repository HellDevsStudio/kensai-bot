const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const { criarEmbedPadrao, criarEmbedErro } = require('../../utils/embeds');
const { getRoleplayGif } = require('../../utils/gifHelper');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('highfive')
        .setDescription('Toca aqui / highfive com um amigo com GIF animado!')
        .addUserOption(opt => opt.setName('alvo').setDescription('Quem você quer cumprimentar?').setRequired(true)),
    async execute(interaction) {
        const alvo = interaction.options.getUser('alvo');
        if (alvo.id === interaction.user.id) {
            return interaction.reply({
                embeds: [criarEmbedErro('Ação Inválida', 'Você não pode tocar aqui com você mesmo!')],
                flags: [MessageFlags.Ephemeral]
            });
        }

        const gifUrl = await getRoleplayGif('highfive');

        const embed = criarEmbedPadrao('✋ Toca Aqui! High Five!')
            .setDescription('✋ **<@' + interaction.user.id + '>** tocou aqui com **<@' + alvo.id + '>**!')
            .setImage(gifUrl)
            .setFooter({ text: 'Interação de ' + interaction.user.username, iconURL: interaction.user.displayAvatarURL() });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('rp_retribuir_highfive_' + interaction.user.id + '_' + alvo.id)
                .setLabel('🔄 Tocar de Volta')
                .setStyle(ButtonStyle.Primary)
        );

        await interaction.reply({ embeds: [embed], components: [row] });
    },
    async executeRetribuir(interaction, originalAuthorId) {
        const gifUrl = await getRoleplayGif('highfive');

        const embed = criarEmbedPadrao('✋ High Five Retribuído!')
            .setDescription('✋ **<@' + interaction.user.id + '>** retribuiu e tocou aqui com **<@' + originalAuthorId + '>** de volta!')
            .setImage(gifUrl)
            .setFooter({ text: 'Retribuído por ' + interaction.user.username, iconURL: interaction.user.displayAvatarURL() });

        await interaction.reply({ embeds: [embed] });
    }
};
