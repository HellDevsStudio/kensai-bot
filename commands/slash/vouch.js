const { SlashCommandBuilder } = require('discord.js');
const { criarEmbedPadrao, criarEmbedErro } = require('../../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('vouch')
        .setDescription('Confirmação rápida de entrega bem-sucedida.')
        .addUserOption(opt => opt.setName('vendedor').setDescription('Vendedor que entregou').setRequired(true))
        .addStringOption(opt => opt.setName('produto').setDescription('Produto adquirido').setRequired(true)),
    async execute(interaction) {
        const vendedor = interaction.options.getUser('vendedor');
        const produto = interaction.options.getString('produto');

        if (vendedor.id === interaction.user.id) {
            return interaction.reply({
                embeds: [criarEmbedErro('Inválido', 'Você não pode dar vouch para você mesmo!')],
                ephemeral: true
            });
        }

        const embed = criarEmbedPadrao('🤝 Compra Confirmada (Vouch)')
            .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
            .setDescription('✅ ' + interaction.user.toString() + ' confirmou uma compra bem-sucedida com ' + vendedor.toString() + '!\n\n📦 **Produto:** ' + produto)
            .setFooter({ text: 'Kensai Store — Garantia e Confiança' });

        await interaction.reply({ embeds: [embed] });
    }
};
