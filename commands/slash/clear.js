const { SlashCommandBuilder, PermissionsBitField, MessageFlags } = require('discord.js');
const { NO_PERMISSION_MSG, checkPermission } = require('../../utils/permissions');
const { criarEmbedPadrao, criarEmbedErro } = require('../../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Limpa mensagens do canal.')
        .addIntegerOption(opt =>
            opt.setName('quantidade')
                .setDescription('Quantidade de mensagens a apagar (1-100)')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(100)
        )
        .addUserOption(opt =>
            opt.setName('usuario')
                .setDescription('Filtrar mensagens apenas deste usuário')
                .setRequired(false)
        ),
    async execute(interaction) {
        if (!checkPermission(interaction.member, PermissionsBitField.Flags.ManageMessages)) {
            return interaction.reply({ content: NO_PERMISSION_MSG, flags: [MessageFlags.Ephemeral] });
        }

        const quantidade = interaction.options.getInteger('quantidade');
        const targetUser = interaction.options.getUser('usuario');

        await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

        try {
            const messages = await interaction.channel.messages.fetch({ limit: targetUser ? 100 : quantidade });
            let toDelete = messages;
            if (targetUser) {
                toDelete = messages.filter(m => m.author.id === targetUser.id);
                toDelete = Array.from(toDelete.values()).slice(0, quantidade);
            }

            const deleted = await interaction.channel.bulkDelete(toDelete, true);
            const count = deleted.size;

            await interaction.editReply({
                content: `🧹 ${count} mensagens foram cortadas deste canal por ${interaction.user}.`
            });

            // Envia aviso temporário no canal que se auto-deleta após 5s
            const tempMsg = await interaction.channel.send({
                embeds: [
                    criarEmbedPadrao(
                        '🧹 Limpeza Realizada',
                        `**${count}** mensagens foram cortadas deste canal por ${interaction.user}.`
                    )
                ]
            }).catch(() => null);

            if (tempMsg) {
                setTimeout(() => tempMsg.delete().catch(() => {}), 5000);
            }
        } catch (error) {
            console.error('Erro no /clear:', error);
            await interaction.editReply({
                embeds: [criarEmbedErro('Erro na Limpeza', 'Não foi possível apagar mensagens com mais de 14 dias ou ocorreu um erro de permissão.')]
            });
        }
    }
};
