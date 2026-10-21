const { SlashCommandBuilder, PermissionsBitField, ChannelType, MessageFlags } = require('discord.js');
const { NO_PERMISSION_MSG, checkPermission } = require('../../utils/permissions');
const { criarEmbedPadrao, criarEmbedErro } = require('../../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unlock')
        .setDescription('Destranca o canal para envio de mensagens.')
        .addChannelOption(opt =>
            opt.setName('canal')
                .setDescription('Canal a ser destrancado (opcional)')
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
                SendMessages: null
            });

            const embed = criarEmbedPadrao(
                '🔓 Canal Destrancado!',
                'O envio de mensagens neste canal foi reativado. Boas conversas a todos!'
            ).setFooter({ text: 'Kensai Store • Segurança e Moderação' });

            await channel.send({ embeds: [embed] });
            await interaction.reply({ content: '🔓 Canal destrancado com sucesso!', flags: [MessageFlags.Ephemeral] });
        } catch (error) {
            console.error('Erro no /unlock:', error);
            await interaction.reply({ embeds: [criarEmbedErro('Erro ao Destrancar Canal', 'Falta de permissão no canal.')], flags: [MessageFlags.Ephemeral] });
        }
    }
};
