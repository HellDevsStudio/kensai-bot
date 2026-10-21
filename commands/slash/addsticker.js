const { SlashCommandBuilder, PermissionsBitField, MessageFlags } = require('discord.js');
const { NO_PERMISSION_MSG, checkPermission } = require('../../utils/permissions');
const { criarEmbedPadrao, criarEmbedErro } = require('../../utils/embeds');

function sanitizeStickerName(name, fallback) {
    var raw = name || fallback || 'kensai_sticker';
    var clean = raw.trim().replace(/[^a-zA-Z0-9_\-\s]/g, '').replace(/\s+/g, ' ');
    if (clean.length < 2) clean = 'sticker_' + Math.floor(Math.random() * 1000);
    return clean.slice(0, 30);
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('addsticker')
        .setDescription('Cria uma nova figurinha (sticker) no servidor a partir de imagem, GIF ou anexo.')
        .addAttachmentOption(function(opt) {
            return opt.setName('arquivo')
                .setDescription('Envie a imagem ou figurinha (PNG, APNG ou GIF até 512 KB)')
                .setRequired(false);
        })
        .addStringOption(function(opt) {
            return opt.setName('nome')
                .setDescription('Nome da figurinha (2 a 30 caracteres)')
                .setRequired(false);
        })
        .addStringOption(function(opt) {
            return opt.setName('emoji_tag')
                .setDescription('Emoji relacionado à figurinha para busca no Discord (ex: ⭐, 🔥, 🪙)')
                .setRequired(false);
        })
        .addStringOption(function(opt) {
            return opt.setName('link')
                .setDescription('Link direto da imagem ou GIF (caso não anexe arquivo)')
                .setRequired(false);
        })
        .addStringOption(function(opt) {
            return opt.setName('descricao')
                .setDescription('Descrição opcional da figurinha (até 100 caracteres)')
                .setRequired(false);
        }),
    async execute(interaction) {
        if (!checkPermission(interaction.member, PermissionsBitField.Flags.ManageGuildExpressions)) {
            return interaction.reply({ content: NO_PERMISSION_MSG, flags: [MessageFlags.Ephemeral] });
        }

        const attachment = interaction.options.getAttachment('arquivo');
        const link = interaction.options.getString('link');
        const nomeOption = interaction.options.getString('nome');
        const emojiTag = interaction.options.getString('emoji_tag') || '⭐';
        const descricao = interaction.options.getString('descricao') || '';

        if (!attachment && !link) {
            return interaction.reply({
                embeds: [criarEmbedErro(
                    'Mídia Não Informada',
                    'Por favor, envie um **arquivo (imagem ou GIF)** ou informe um **link** de imagem para criar a figurinha!'
                )],
                flags: [MessageFlags.Ephemeral]
            });
        }

        await interaction.deferReply();

        let sourceUrl = '';
        let defaultName = 'kensai_sticker';

        if (attachment) {
            sourceUrl = attachment.url;
            defaultName = attachment.name ? attachment.name.split('.')[0] : 'kensai_sticker';
        } else if (link) {
            const raw = link.trim();
            sourceUrl = raw;
            const urlParts = raw.split('/');
            const lastPart = urlParts[urlParts.length - 1].split('?')[0];
            if (lastPart) defaultName = lastPart.split('.')[0];
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

        const finalName = sanitizeStickerName(nomeOption, defaultName);
        const finalTag = emojiTag.trim().slice(0, 50) || '⭐';
        const finalDesc = descricao.trim().slice(0, 100);

        try {
            const sticker = await interaction.guild.stickers.create({
                file: sourceUrl,
                name: finalName,
                tags: finalTag,
                description: finalDesc,
                reason: 'Figurinha criada por ' + interaction.user.tag
            });

            const embed = criarEmbedPadrao('✨ Figurinha Criada com Sucesso!')
                .setThumbnail(sticker.url)
                .setDescription('A figurinha **' + sticker.name + '** foi adicionada por ' + interaction.user.toString() + '!')
                .addFields(
                    { name: '🏷️ Nome', value: String.fromCharCode(96) + sticker.name + String.fromCharCode(96), inline: true },
                    { name: '🎭 Emoji Tag', value: sticker.tags || '⭐', inline: true },
                    { name: '📝 Descrição', value: sticker.description || 'Nenhuma', inline: true },
                    { name: '🆔 ID', value: String.fromCharCode(96) + sticker.id + String.fromCharCode(96), inline: true },
                    { name: '🔗 Mídia Original', value: '[Abrir Figurinha](' + sticker.url + ')', inline: false }
                );

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('Erro no /addsticker:', error);
            let msgErro = 'Não foi possível adicionar a figurinha.';
            const errStr = (error.message || '').toLowerCase();

            if (errStr.includes('512.0 kb') || errStr.includes('size')) {
                msgErro = 'O arquivo ultrapassa o limite de **512 KB** permitido pelo Discord para figurinhas. Envie uma versão menor ou comprimida.';
            } else if (errStr.includes('maximum number of stickers reached') || errStr.includes('maximum stickers')) {
                msgErro = 'O servidor já atingiu a cota máxima de figurinhas disponíveis para o nível de Boost atual.';
            } else if (errStr.includes('missing permissions')) {
                msgErro = 'O bot não possui a permissão de **Gerenciar Expressões / Figurinhas** no servidor.';
            } else if (errStr.includes('invalid form body') || errStr.includes('asset')) {
                msgErro = 'Formato ou dimensões inválidas. O Discord aceita PNG, APNG, Lottie e GIF de até 512 KB (dimensão recomendada: 320x320).';
            }

            await interaction.editReply({
                embeds: [criarEmbedErro('Falha ao Criar Figurinha', msgErro)]
            });
        }
    }
};
