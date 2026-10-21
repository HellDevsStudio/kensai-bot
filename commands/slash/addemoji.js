const { SlashCommandBuilder, PermissionsBitField, MessageFlags } = require('discord.js');
const { NO_PERMISSION_MSG, checkPermission } = require('../../utils/permissions');
const { criarEmbedPadrao, criarEmbedErro } = require('../../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('addemoji')
        .setDescription('Adiciona um novo emoji ao servidor via URL ou emoji existente.')
        .addStringOption(opt => opt.setName('emoji_ou_link').setDescription('Link da imagem ou emoji existente').setRequired(true))
        .addStringOption(opt => opt.setName('nome').setDescription('Nome do novo emoji').setRequired(true)),
    async execute(interaction) {
        if (!checkPermission(interaction.member, PermissionsBitField.Flags.ManageGuildExpressions)) {
            return interaction.reply({ content: NO_PERMISSION_MSG, flags: [MessageFlags.Ephemeral] });
        }

        const raw = interaction.options.getString('emoji_ou_link').trim();
        const nome = interaction.options.getString('nome').replace(/[^a-zA-Z0-9_]/g, '_');

        let url = raw;
        const customEmojiMatch = raw.match(/<(a)?:\w+:(\d+)>/);
        if (customEmojiMatch) {
            const isAnimated = !!customEmojiMatch[1];
            const emojiId = customEmojiMatch[2];
            url = 'https://cdn.discordapp.com/emojis/' + emojiId + '.' + (isAnimated ? 'gif' : 'png');
        }

        try {
            const emoji = await interaction.guild.emojis.create({ attachment: url, name: nome });
            const embed = criarEmbedPadrao('✨ Emoji Adicionado com Sucesso!')
                .setThumbnail(emoji.url)
                .setDescription('O emoji ' + emoji.toString() + ' (`:' + emoji.name + ':`) foi adicionado por ' + interaction.user.toString() + '.')
                .addFields(
                    { name: '🆔 ID do Emoji', value: emoji.id, inline: true },
                    { name: '🔗 Link', value: '[Abrir Imagem](' + emoji.url + ')', inline: true }
                );

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Erro no /addemoji:', error);
            await interaction.reply({
                embeds: [criarEmbedErro('Erro ao Adicionar Emoji', 'Verifique se a URL é válida ou se o servidor atingiu o limite de emojis.')],
                flags: [MessageFlags.Ephemeral]
            });
        }
    }
};
