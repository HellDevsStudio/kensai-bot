const { PermissionsBitField } = require('discord.js');
const { NO_PERMISSION_MSG, checkPermission } = require('../../utils/permissions');
const { criarEmbedPadrao, criarEmbedErro } = require('../../utils/embeds');

function sanitizeEmojiName(name, fallback = 'kensai_emoji') {
    let clean = (name || fallback).trim().replace(/[^a-zA-Z0-9_]/g, '_');
    clean = clean.replace(/_+/g, '_').replace(/^_+|_+$/g, '');
    if (clean.length < 2) clean = 'emoji_' + Math.floor(Math.random() * 1000);
    return clean.slice(0, 32);
}

module.exports = {
    name: 'addemoji',
    aliases: ['roubaremoji', 'clonaremoji', 'criaremoji', 'addgif'],
    description: 'Adiciona um emoji estático ou GIF animado ao servidor.',
    async execute(message, args) {
        if (!checkPermission(message.member, PermissionsBitField.Flags.ManageGuildExpressions)) {
            return message.reply(NO_PERMISSION_MSG);
        }

        const attachment = message.attachments.first();
        let sourceUrl = '';
        let defaultName = 'kensai_emoji';
        let nomeArg = '';

        if (attachment) {
            sourceUrl = attachment.url;
            defaultName = attachment.name ? attachment.name.split('.')[0] : 'kensai_emoji';
            nomeArg = args[0] || '';
        } else if (args[0]) {
            const raw = args[0].trim();
            const customEmojiMatch = raw.match(/<(a)?:(\w+):(\d+)>/);
            if (customEmojiMatch) {
                const isAnimated = !!customEmojiMatch[1];
                defaultName = customEmojiMatch[2];
                const emojiId = customEmojiMatch[3];
                sourceUrl = 'https://cdn.discordapp.com/emojis/' + emojiId + '.' + (isAnimated ? 'gif' : 'png');
            } else {
                sourceUrl = raw;
                const urlParts = raw.split('/');
                const lastPart = urlParts[urlParts.length - 1].split('?')[0];
                if (lastPart) defaultName = lastPart.split('.')[0];
            }
            nomeArg = args[1] || '';
        } else {
            return message.reply({
                embeds: [
                    criarEmbedErro(
                        'Uso Correto',
                        'Você pode criar emojis e GIFs de três formas:\n' +
                        '1️⃣ **Anexar imagem ou GIF na mensagem**: `k!addemoji [nome]`\n' +
                        '2️⃣ **Link de imagem/GIF**: `k!addemoji https://... [nome]`\n' +
                        '3️⃣ **Emoji de outro servidor**: `k!addemoji <:emoji:id> [nome]`'
                    )
                ]
            });
        }

        if (sourceUrl.includes('tenor.com/view/')) {
            try {
                const resp = await fetch(sourceUrl, {
                    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
                });
                const html = await resp.text();
                const gifMatch = html.match(/https:\/\/[^"']+\.gif/i);
                if (gifMatch) {
                    sourceUrl = gifMatch[0];
                }
            } catch (e) {}
        }

        const finalName = sanitizeEmojiName(nomeArg || defaultName);

        try {
            const emoji = await message.guild.emojis.create({
                attachment: sourceUrl,
                name: finalName
            });

            const embed = criarEmbedPadrao('✨ Emoji Criado com Sucesso!')
                .setThumbnail(emoji.imageURL())
                .setDescription('O emoji **' + emoji.toString() + '** (`:' + emoji.name + ':`) foi adicionado por ' + message.author.toString() + '!')
                .addFields(
                    { name: '🏷️ Nome', value: '`:' + emoji.name + ':`', inline: true },
                    { name: '🎭 Tipo', value: emoji.animated ? '🎞️ GIF Animado' : '🖼️ Imagem Estática', inline: true },
                    { name: '🆔 ID', value: '`' + emoji.id + '`', inline: true },
                    { name: '🔗 Mídia Original', value: '[Abrir Mídia](' + emoji.imageURL() + ')', inline: false }
                );

            message.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Erro no k!addemoji:', error);
            let msgErro = 'Não foi possível adicionar o emoji.';
            if (error.message?.includes('256.0 kb') || error.message?.includes('size')) {
                msgErro = 'O arquivo ultrapassa o limite de **256 KB** do Discord para emojis. Tente enviar um GIF ou imagem comprimida.';
            } else if (error.message?.includes('Maximum number of emojis reached')) {
                msgErro = 'O servidor atingiu a cota máxima de emojis.';
            }
            message.reply({ embeds: [criarEmbedErro('Falha ao Criar Emoji', msgErro)] });
        }
    }
};
