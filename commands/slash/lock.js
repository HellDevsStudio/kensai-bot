const { SlashCommandBuilder, PermissionsBitField, ChannelType, MessageFlags } = require('discord.js');
const { NO_PERMISSION_MSG, checkPermission } = require('../../utils/permissions');
const { criarEmbedPadrao, criarEmbedErro } = require('../../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('lock')
        .setDescription('Tranca o canal para envio de mensagens.')
        .addChannelOption(opt =>
            opt.setName('canal')
                .setDescription('Canal a ser trancado (opcional)')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(false)
        ),
    async execute(interaction) {
        if (!checkPermission(interaction.member, PermissionsBitField.Flags.ManageChannels)) {
            return interaction.reply({ content: NO_PERMISSION_MSG, flags: [MessageFlags.Ephemeral] });
        }

        const channel = interaction.options.getChannel('canal') || interaction.channel;

        try {
            await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
                SendMessages: false
            });

            const embed = criarEmbedPadrao(
                '🔒 Canal Trancado pela Staff',
                'O envio de mensagens neste canal foi desativado temporariamente pela moderação da Kensai Store.'
            ).setFooter({ text: 'Kensai Store • Segurança e Moderação' });

            await channel.send({ embeds: [embed] });
            if (channel.id !== interaction.channel.id) {
                await interaction.reply({ content: `🔒 O canal ${channel} foi trancado com sucesso!`, flags: [MessageFlags.Ephemeral] });
            } else {
                await interaction.reply({ content: '🔒 Canal trancado com sucesso!', flags: [MessageFlags.Ephemeral] });
            }
        } catch (error) {
            console.error('Erro no /lock:', error);
            await interaction.reply({ embeds: [criarEmbedErro('Erro ao Trancar Canal', 'Falta de permissão no canal.')], flags: [MessageFlags.Ephemeral] });
        }
    }
};
