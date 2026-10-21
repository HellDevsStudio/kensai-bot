const { PermissionsBitField } = require('discord.js');
const { NO_PERMISSION_MSG, checkPermission } = require('../../utils/permissions');
const { criarEmbedPadrao, criarEmbedErro } = require('../../utils/embeds');

module.exports = {
    name: 'addemoji',
    aliases: ['roubaremoji', 'clonaremoji'],
    description: 'Adiciona um emoji ao servidor.',
    async execute(message, args) {
        if (!checkPermission(message.member, PermissionsBitField.Flags.ManageGuildExpressions)) {
            return message.reply(NO_PERMISSION_MSG);
        }

        const raw = args[0];
        const nome = (args[1] || 'kensai_emoji').replace(/[^a-zA-Z0-9_]/g, '_');

        if (!raw) {
            return message.reply('❌ Uso correto: `k!addemoji [emoji/link] [nome]`');
        }

        let url = raw;
        const customEmojiMatch = raw.match(/<(a)?:\w+:(\d+)>/);
        if (customEmojiMatch) {
            const isAnimated = !!customEmojiMatch[1];
            const emojiId = customEmojiMatch[2];
            url = 'https://cdn.discordapp.com/emojis/' + emojiId + '.' + (isAnimated ? 'gif' : 'png');
        }

        try {
            const emoji = await message.guild.emojis.create({ attachment: url, name: nome });
            const embed = criarEmbedPadrao('✨ Emoji Adicionado com Sucesso!')
                .setThumbnail(emoji.url)
                .setDescription('O emoji ' + emoji.toString() + ' (`:' + emoji.name + ':`) foi adicionado por ' + message.author.toString() + '.');

            message.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Erro no k!addemoji:', error);
            message.reply({ embeds: [criarEmbedErro('Erro ao Adicionar Emoji', 'Falha ao processar imagem ou emoji.')] });
        }
    }
};
