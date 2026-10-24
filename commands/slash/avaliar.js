const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { 
    identificarPartesTicket, 
    gerarPainelAvaliacaoPayload 
} = require('../../utils/avaliarCore');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('avaliar')
        .setDescription('Solicita avaliação do atendimento ao cliente no ticket.')
        .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages)
        .addUserOption(opt => 
            opt.setName('staff')
                .setDescription('Atendente / Vendedor (opcional - detectado sozinho no ticket)')
                .setRequired(false)
        )
        .addUserOption(opt => 
            opt.setName('cliente')
                .setDescription('Cliente (opcional - detectado sozinho no ticket)')
                .setRequired(false)
        ),

    async execute(interaction) {
        let staffUser = interaction.options.getUser('staff');
        let clienteUser = interaction.options.getUser('cliente');

        const partes = identificarPartesTicket(interaction.channelId, interaction.channel, interaction.user);

        const staffId = staffUser?.id || partes.staffId || interaction.user.id;
        const clienteId = clienteUser?.id || partes.clienteId;

        const painel = gerarPainelAvaliacaoPayload({
            staffId,
            clienteId,
            guild: interaction.guild
        });

        return interaction.reply({
            embeds: painel.embeds,
            components: painel.components
        });
    }
};
