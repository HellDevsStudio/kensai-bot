const { SlashCommandBuilder, PermissionsBitField, ChannelType, MessageFlags } = require('discord.js');
const { NO_PERMISSION_MSG, checkPermission } = require('../../utils/permissions');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('say')
        .setDescription('Faz o Ken falar no canal especificado (Exclusivo Administrador).')
        .addStringOption(opt => opt.setName('mensagem').setDescription('Mensagem a ser enviada').setRequired(true))
        .addChannelOption(opt =>
            opt.setName('canal')
                .setDescription('Canal de destino (opcional)')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(false)
        ),
    async execute(interaction) {
        if (!checkPermission(interaction.member, PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ content: NO_PERMISSION_MSG, flags: [MessageFlags.Ephemeral] });
        }

        const targetChannel = interaction.options.getChannel('canal') || interaction.channel;
        let msg = interaction.options.getString('mensagem');

        // Sanitização contra menção em massa abusiva
        msg = msg.replace(/@(everyone|here)/gi, '@​$1');

        await targetChannel.send({ content: msg });
        await interaction.reply({
            content: `✅ Mensagem enviada com sucesso no canal ${targetChannel}!`,
            flags: [MessageFlags.Ephemeral]
        });
    }
};
