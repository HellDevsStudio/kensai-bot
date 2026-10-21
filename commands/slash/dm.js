const { SlashCommandBuilder, PermissionsBitField, MessageFlags } = require('discord.js');
const { NO_PERMISSION_MSG, checkPermission } = require('../../utils/permissions');
const { criarEmbedPadrao, criarEmbedErro } = require('../../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('dm')
        .setDescription('Envia uma notificação oficial da loja na DM de um cliente.')
        .addUserOption(opt => opt.setName('usuario').setDescription('Cliente').setRequired(true))
        .addStringOption(opt => opt.setName('mensagem').setDescription('Mensagem a enviar').setRequired(true)),
    async execute(interaction) {
        if (!checkPermission(interaction.member, PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ content: NO_PERMISSION_MSG, flags: [MessageFlags.Ephemeral] });
        }

        // Deferir resposta imediatamente para evitar expiração do token de interação (DiscordAPIError 10062)
        await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

        const targetUser = interaction.options.getUser('usuario');
        const text = interaction.options.getString('mensagem');

        const embed = criarEmbedPadrao('📬 Notificação Oficial • Kensai Store', text)
            .setFooter({ text: 'Enviado por: ' + interaction.user.tag + ' • Kensai Store Support' });

        try {
            await targetUser.send({ embeds: [embed] });
            await interaction.editReply({
                content: '✅ Notificação enviada com sucesso para a DM de ' + targetUser.toString() + '!'
            });
        } catch (error) {
            await interaction.editReply({
                embeds: [criarEmbedErro('DM Fechada', 'Não foi possível entregar a mensagem para ' + targetUser.toString() + '. As mensagens diretas do usuário podem estar desativadas.')]
            });
        }
    }
};
