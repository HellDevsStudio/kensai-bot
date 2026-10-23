const { 
    EmbedBuilder, 
    ActionRowBuilder, 
    StringSelectMenuBuilder, 
    StringSelectMenuOptionBuilder 
} = require('discord.js');
const config = require('../config');
const { getItensConfig } = require('./ticketConfigs');

/**
 * Constrói o painel oficial de itens do Kensai Store no estilo da loja Kensai:
 * - Menu interativo de categorias de itens (Limitados, Espadas, Emotes, Explosões, Personalizado)
 * - Identidade visual oficial #9a2ea6
 */
function gerarPainelItensPayload(guild) {
    const serverIcon = (typeof guild?.iconURL === 'function' ? guild.iconURL({ dynamic: true, size: 512 }) : null);

    const embed = new EmbedBuilder()
        .setAuthor({ 
            name: `⛩️ ${guild?.name ? guild.name.toUpperCase() : 'KENSAI STORE'} • ARSENAL DE BLADE BALL`, 
            iconURL: serverIcon || undefined
        })
        .setTitle('⚔️ ARSENAL & ENCOMENDAS • KENSAI STORE')
        .setDescription(
            '> ⚡ **Entrega Segura:** Servidor VIP privativo com entrega imediata pela Staff\n' +
            '> 🕒 **Atendimento Ágil:** Horários diários e suporte humanizado\n' +
            '> 🛡️ **Garantia Kensai:** Procedência 100% limpa, auditada e sem riscos\n\n' +
            '⚔️ **Katanas & Espadas** ➔ Skins míticas, lendárias e coleções raras\n' +
            '🎭 **Emotes Exclusivos** ➔ Animações especiais e comemorações\n' +
            '💥 **Explosões de Abate** ➔ Efeitos visuais épicos de impacto e finalização\n' +
            '⏳ **Limitados & Packs** ➔ Pacotes sazonais & itens raros de cofre\n' +
            '⚙️ **Sob Encomenda** ➔ Pedidos personalizados direto com a Staff\n\n' +
            '──────────────────────────────────────────\n' +
            '💡 *Selecione a categoria no menu abaixo para conferir o estoque ou encomendar:*'
        )
        .setColor(config.EMBED_COLOR || 0x9a2ea6)
        .setFooter({ text: 'Kensai Store • A lâmina mais afiada do atendimento' })
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
                    .setLabel('Limitados & Packs')
                    .setDescription('Pacotes especiais por tempo limitado')
                    .setValue('Limitados')
                    .setEmoji('⏳'),
                new StringSelectMenuOptionBuilder()
                    .setLabel('Katanas & Espadas')
                    .setDescription('Skins, katanas e espadas do Blade Ball')
                    .setValue('Espada')
                    .setEmoji('⚔️'),
                new StringSelectMenuOptionBuilder()
                    .setLabel('Emotes Exclusivos')
                    .setDescription('Animações e emotes exclusivos')
                    .setValue('Emote')
                    .setEmoji('🎭'),
                new StringSelectMenuOptionBuilder()
                    .setLabel('Explosões de Abate')
                    .setDescription('Efeitos e explosões personalizadas')
                    .setValue('Explosão')
                    .setEmoji('💥'),
                new StringSelectMenuOptionBuilder()
                    .setLabel('Encomenda Personalizada')
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
