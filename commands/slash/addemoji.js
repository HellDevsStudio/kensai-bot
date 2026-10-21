const { SlashCommandBuilder, PermissionsBitField, MessageFlags } = require('discord.js');
const { NO_PERMISSION_MSG, checkPermission } = require('../../utils/permissions');
const { criarEmbedPadrao, criarEmbedErro } = require('../../utils/embeds');

function sanitizeEmojiName(name, fallback = 'kensai_emoji') {
    let clean = (name || fallback).trim().replace(/[^a-zA-Z0-9_]/g, '_');
    clean = clean.replace(/_+/g, '_').replace(/^_+|_+$/g, '');
    if (clean.length < 2) clean = 'emoji_' + Math.floor(Math.random() * 1000);
    return clean.slice(0, 32);
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('addemoji')
        .setDescription('Cria um novo emoji a partir de imagem, GIF, anexo ou emoji de outro servidor.')
        .addAttachmentOption(opt =>
            opt.setName('arquivo')
                .setDescription('Envie a imagem ou GIF diretamente do seu dispositivo')
                .setRequired(false)
        )
        .addStringOption(opt =>
            opt.setName('link_ou_emoji')
                .setDescription('Link da imagem/GIF ou emoji de outro servidor (ex: <:nome:id> ou <a:nome:id>)')
                .setRequired(false)
        )
        .addStringOption(opt =>
            opt.setName('nome')
                .setDescription('Nome personalizado para o emoji (opcional)')
                .setRequired(false)
        ),
    async execute(interaction) {
        if (!checkPermission(interaction.member, PermissionsBitField.Flags.ManageGuildExpressions)) {
            return interaction.reply({ content: NO_PERMISSION_MSG, flags: [MessageFlags.Ephemeral] });
        }

        const attachment = interaction.options.getAttachment('arquivo');
        const linkOuEmoji = interaction.options.getString('link_ou_emoji');
        const nomeOption = interaction.options.getString('nome');

        if (!attachment && !linkOuEmoji) {
            return interaction.reply({
                embeds: [criarEmbedErro('Mídia Não Informada', 'Por favor, envie um **arquivo (imagem ou GIF)** ou informe um **link / emoji** de outro servidor!')],
                flags: [MessageFlags.Ephemeral]
            });
        }

        await interaction.deferReply();

        let sourceUrl = '';
        let defaultName = 'kensai_emoji';
        let isAnimated = false;

        if (attachment) {
            sourceUrl = attachment.url;
            defaultName = attachment.name ? attachment.name.split('.')[0] : 'kensai_emoji';
            if (attachment.contentType?.includes('gif') || attachment.name?.toLowerCase().endsWith('.gif')) {
                isAnimated = true;
            }
        } else if (linkOuEmoji) {
            const raw = linkOuEmoji.trim();
            const customEmojiMatch = raw.match(/<(a)?:(\w+):(\d+)>/);
            if (customEmojiMatch) {
                isAnimated = !!customEmojiMatch[1];
                defaultName = customEmojiMatch[2];
                const emojiId = customEmojiMatch[3];
                sourceUrl = 'https://cdn.discordapp.com/emojis/' + emojiId + '.' + (isAnimated ? 'gif' : 'png');
            } else {
                sourceUrl = raw;
                if (raw.toLowerCase().includes('.gif')) isAnimated = true;
                const urlParts = raw.split('/');
                const lastPart = urlParts[urlParts.length - 1].split('?')[0];
                if (lastPart) defaultName = lastPart.split('.')[0];
            }
        }

        // Se for link do Tenor (página web), tentar extrair o GIF real
        if (sourceUrl.includes('tenor.com/view/')) {
            try {
                const resp = await fetch(sourceUrl, {
                    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
                });
                const html = await resp.text();
                const gifMatch = html.match(/https:\/\/[^"']+\.gif/i);
                if (gifMatch) {
                    sourceUrl = gifMatch[0];
                    isAnimated = true;
                }
            } catch (e) {
                // segue com a url original
            }
        }

        const finalName = sanitizeEmojiName(nomeOption || defaultName);

        try {
            const emoji = await interaction.guild.emojis.create({
                attachment: sourceUrl,
                name: finalName
            });

            const embed = criarEmbedPadrao('✨ Emoji Criado com Sucesso!')
                .setThumbnail(emoji.imageURL())
                .setDescription('O emoji **' + emoji.toString() + '** (`:' + emoji.name + ':`) foi adicionado por ' + interaction.user.toString() + '!')
                .addFields(
                    { name: '🏷️ Nome', value: '`:' + emoji.name + ':`', inline: true },
                    { name: '🎭 Tipo', value: emoji.animated ? '🎞️ GIF Animado' : '🖼️ Imagem Estática', inline: true },
                    { name: '🆔 ID', value: '`' + emoji.id + '`', inline: true },
                    { name: '🔗 Mídia Original', value: '[Abrir Mídia](' + emoji.imageURL() + ')', inline: false }
                );

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('Erro no /addemoji:', error);
            let msgErro = 'Não foi possível adicionar o emoji.';
            if (error.message?.includes('256.0 kb') || error.message?.includes('size')) {
                msgErro = 'O arquivo ultrapassa o limite de **256 KB** permitido pelo Discord para emojis. Tente enviar uma versão menor ou comprimida.';
            } else if (error.message?.includes('Maximum number of emojis reached')) {
                msgErro = 'O servidor já atingiu a cota máxima de slots de emojis (estáticos ou animados).';
            } else if (error.message?.includes('Missing Permissions')) {
                msgErro = 'O bot não possui a permissão de **Gerenciar Expressões** (Manage Guild Expressions) no servidor.';
            }

            await interaction.editReply({
                embeds: [criarEmbedErro('Falha ao Criar Emoji', msgErro)]
            });
        }
    }
};
