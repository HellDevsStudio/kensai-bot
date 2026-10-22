const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { gerarPainelItensPayload } = require('../../utils/renderItensPanel.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('painel-itens')
        .setDescription('Envia o painel de encomendas de itens (Espadas, Emotes, Explosões).')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        await interaction.deferReply({ flags: [MessageFlags.Ephemeral] }).catch(() => {});
        const payload = gerarPainelItensPayload(interaction.guild);
        await interaction.channel.send(payload);
        await interaction.editReply({ content: '✅ Painel de itens enviado com sucesso neste canal!' }).catch(() => {});
    }
};
