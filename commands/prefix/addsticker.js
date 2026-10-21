const { PermissionsBitField } = require('discord.js');
const { NO_PERMISSION_MSG, checkPermission } = require('../../utils/permissions');
const { criarEmbedPadrao, criarEmbedErro } = require('../../utils/embeds');

function sanitizeStickerName(name, fallback) {
    var raw = name || fallback || 'kensai_sticker';
    var clean = raw.trim().replace(/[^a-zA-Z0-9_\-\s]/g, '').replace(/\s+/g, ' ');
    if (clean.length < 2) clean = 'sticker_' + Math.floor(Math.random() * 1000);
    return clean.slice(0, 30);
}

module.exports = {
    name: 'addsticker',
    aliases: ['criaresticker', 'addfigurinha', 'criarfigurinha', 'clonarsticker'],
    description: 'Adiciona uma figurinha (sticker) ao servidor a partir de imagem, GIF ou anexo.',
    async execute(message, args) {
        if (!checkPermission(message.member, PermissionsBitField.Flags.ManageGuildExpressions)) {
            return message.reply(NO_PERMISSION_MSG);
        }

        const attachment = message.attachments.first();
        let sourceUrl = '';
        let defaultName = 'kensai_sticker';
        let nomeArg = '';
        let emojiTag = '⭐';
        let descricao = '';

        if (attachment) {
            sourceUrl = attachment.url;
            defaultName = attachment.name ? attachment.name.split('.')[0] : 'kensai_sticker';
            nomeArg = args[0] || '';
            emojiTag = args[1] || '⭐';
            descricao = args.slice(2).join(' ') || '';
        } else if (args[0]) {
            const raw = args[0].trim();
            sourceUrl = raw;
            const urlParts = raw.split('/');
            const lastPart = urlParts[urlParts.length - 1].split('?')[0];
            if (lastPart) defaultName = lastPart.split('.')[0];
            nomeArg = args[1] || '';
            emojiTag = args[2] || '⭐';
            descricao = args.slice(3).join(' ') || '';
        } else {
            return message.reply({
                embeds: [
                    criarEmbedErro(
                        'Uso Correto do k!addsticker',
                        'Você pode criar figurinhas de duas formas:\n' +
                        '1️⃣ **Anexar imagem ou GIF na mensagem**:\n`k!addsticker [nome] [emoji_tag] [descrição]`\n\n' +
                        '2️⃣ **Via Link direto de imagem ou GIF**:\n`k!addsticker <link> [nome] [emoji_tag] [descrição]`\n\n' +
                        '💡 *Limite do Discord: até 512 KB por figurinha.*'
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

        const finalName = sanitizeStickerName(nomeArg, defaultName);
        const finalTag = emojiTag.trim().slice(0, 50) || '⭐';
        const finalDesc = descricao.trim().slice(0, 100);

        try {
            const sticker = await message.guild.stickers.create({
                file: sourceUrl,
                name: finalName,
                tags: finalTag,
                description: finalDesc,
                reason: 'Figurinha criada por ' + message.author.tag
            });

            const embed = criarEmbedPadrao('✨ Figurinha Criada com Sucesso!')
                .setThumbnail(sticker.url)
                .setDescription('A figurinha **' + sticker.name + '** foi adicionada por ' + message.author.toString() + '!')
                .addFields(
                    { name: '🏷️ Nome', value: String.fromCharCode(96) + sticker.name + String.fromCharCode(96), inline: true },
                    { name: '🎭 Emoji Tag', value: sticker.tags || '⭐', inline: true },
                    { name: '📝 Descrição', value: sticker.description || 'Nenhuma', inline: true },
                    { name: '🆔 ID', value: String.fromCharCode(96) + sticker.id + String.fromCharCode(96), inline: true },
                    { name: '🔗 Mídia Original', value: '[Abrir Figurinha](' + sticker.url + ')', inline: false }
                );

            await message.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Erro no k!addsticker:', error);
            let msgErro = 'Não foi possível adicionar a figurinha.';
            const errStr = (error.message || '').toLowerCase();

            if (errStr.includes('512.0 kb') || errStr.includes('size')) {
                msgErro = 'O arquivo ultrapassa o limite de **512 KB** permitido pelo Discord para figurinhas.';
            } else if (errStr.includes('maximum number of stickers reached') || errStr.includes('maximum stickers')) {
                msgErro = 'O servidor atingiu a cota máxima de figurinhas do nível de Boost atual.';
            } else if (errStr.includes('missing permissions')) {
                msgErro = 'O bot não possui a permissão de **Gerenciar Expressões / Figurinhas**.';
            }
            await message.reply({ embeds: [criarEmbedErro('Falha ao Criar Figurinha', msgErro)] });
        }
    }
};
