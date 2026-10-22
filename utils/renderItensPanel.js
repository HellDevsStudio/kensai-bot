const { 
    AttachmentBuilder,
    EmbedBuilder, 
    ActionRowBuilder, 
    StringSelectMenuBuilder, 
    StringSelectMenuOptionBuilder 
} = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('../config');
const { getItensConfig } = require('./ticketConfigs');

/**
 * Constrói o painel oficial de itens do Kensai Store (Inspirado no modelo do Blade Ball):
 * - Menu interativo de categorias de itens (Limitados, Espadas, Emotes, Explosões, Personalizado)
 * - Identidade visual oficial #9a2ea6
 */
function gerarPainelItensPayload(guild) {
    const serverIcon = (typeof guild?.iconURL === 'function' ? guild.iconURL({ dynamic: true, size: 512 }) : null);
    const itensCfg = getItensConfig();

    const embed = new EmbedBuilder()
        .setAuthor({ 
            name: `${guild?.name ? guild.name.toUpperCase() : 'KENSAI STORE'} • ARSENAL OFICIAL`, 
            iconURL: serverIcon || undefined
        })
        .setTitle('🗡️ ARSENAL & ENCOMENDAS • BLADE BALL')
        .setDescription(
            `> ⚡ **Entrega Segura:** Via servidor privado com suporte dedicado\n` +
            `> 🕒 **Horários de Atendimento:** Equipe ativa em escala diária\n` +
            `> 🛡️ **Garantia de Procedência:** Itens 100% legítimos e auditados\n\n` +
            `• 🗡️ **Espadas** ➔ Skins míticas, lendárias e raras\n` +
            `• 🎭 **Emotes** ➔ Animações e comemorações exclusivas\n` +
            `• 💥 **Explosões** ➔ Efeitos visuais de impacto e abate\n` +
            `• ⏳ **Limitados** ➔ Pacotes sazonais & itens de cofre\n` +
            `• ⚙️ **Sob Encomenda** ➔ Pedidos personalizados com a Staff\n\n` +
            `*Selecione a categoria no menu abaixo para conferir o estoque ou encomendar.*`.trim()
        )
        .setColor(config.EMBED_COLOR || 0x9a2ea6)
        .setFooter({ text: 'Kensai Store • Encomendas de Itens & Arsenal Oficial' })
        .setTimestamp();

    if (serverIcon) {
        embed.setThumbnail(serverIcon);
    }

    const menu = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('menu_categoria_item')
            .setPlaceholder('📦 Selecione a categoria do item...')
            .addOptions([
                new StringSelectMenuOptionBuilder()
                    .setLabel('Limitados (Packs)')
                    .setDescription('Pacotes especiais por tempo limitado')
                    .setValue('Limitados')
                    .setEmoji('⏳'),
                new StringSelectMenuOptionBuilder()
                    .setLabel('Espadas')
                    .setDescription('Skins e espadas do Blade Ball')
                    .setValue('Espada')
                    .setEmoji('🗡️'),
                new StringSelectMenuOptionBuilder()
                    .setLabel('Emotes')
                    .setDescription('Animações e emotes exclusivos')
                    .setValue('Emote')
                    .setEmoji('🎭'),
                new StringSelectMenuOptionBuilder()
                    .setLabel('Explosões')
                    .setDescription('Efeitos e explosões personalizadas')
                    .setValue('Explosão')
                    .setEmoji('💥'),
                new StringSelectMenuOptionBuilder()
                    .setLabel('Pedido Personalizado')
                    .setDescription('Solicitar um item específico — valor negociável')
                    .setValue('Personalizado')
                    .setEmoji('⚙️'),
            ])
    );

    return {
        embeds: [embed],
        components: [menu]
    };
}

module.exports = {
    gerarPainelItensPayload
};
