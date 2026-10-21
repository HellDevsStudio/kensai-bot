const { SlashCommandBuilder } = require('discord.js');
const { criarEmbedPadrao } = require('../../utils/embeds');
const { readData, writeData } = require('../../utils/db');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('afk')
        .setDescription('Coloca seu status em modo ausente (AFK).')
        .addStringOption(opt => opt.setName('motivo').setDescription('Motivo da ausência').setRequired(false)),
    async execute(interaction) {
        const reason = interaction.options.getString('motivo') || 'Ausente';
        const afkData = readData('afk', {});

        afkData[interaction.user.id] = {
            reason: reason,
            timestamp: Date.now()
        };
        writeData('afk', afkData);

        const embed = criarEmbedPadrao(
            '💤 Modo AFK Ativado',
            `**${interaction.user.username}**, seu status AFK foi ativado com sucesso!\n📝 **Motivo:** ${reason}\n\n*Assim que você enviar uma mensagem no chat, seu AFK será removido automaticamente.*`.trim()
        );

        await interaction.reply({ embeds: [embed] });
    }
};
