const { ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const { criarEmbedPadrao } = require('./embeds');
const { getSuporteConfig, getTokensConfig, getItensConfig } = require('./ticketConfigs');

const TOKEN_EMOJI_ID = '1562671579257770147';
const TOKEN_EMOJI_STR = '<:token:1562671579257770147>';
const TOKEN_EMOJI_OBJ = { id: TOKEN_EMOJI_ID, name: 'token' };

/**
 * Gera payload do Painel de Suporte Oficial (Design Premium Kensai Store)
 */
function gerarPainelSuportePayload() {
    const config = getSuporteConfig();
    const embed = criarEmbedPadrao('⚔️ Central de Suporte & Atendimento Oficial')
        .setAuthor({ name: '⛩️ CENTRAL DE ATENDIMENTO • KENSAI STORE' })
        .setDescription(
            '> Seja muito bem-vindo à nossa **Central Oficial de Atendimento**.\n' +
            '> Selecione o departamento correspondente abaixo para iniciar uma sala privativa e criptografada com a nossa equipe.\n\n' +
            '🛒 **Setor de Compras & Encomendas**\n' +
            '• Dúvidas comerciais, status de entrega, encomendas personalizadas e pagamentos.\n\n' +
            '🔎 **Suporte Geral & Comunidade**\n' +
            '• Dúvidas do servidor, esclarecimento de regras, cargos VIP, parcerias e sugestões.\n\n' +
            '🚨 **Ouvidoria & Denúncias**\n' +
            '• Reporte de golpes (scams), fraudes, roubos ou violação grave das diretrizes.\n\n' +
            '──────────────────────────────────────────\n' +
            '🛡️ **Atendimento Privativo:** Sala exclusiva visível apenas para você e a Staff.\n' +
            '📜 **Segurança & Auditoria:** Todas as mensagens são arquivadas em logs com transcript oficial.'
        )
        .setFooter({ text: 'Kensai Store • A lâmina mais rápida do atendimento' });

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('ticket_abrir_compra')
            .setLabel('Compras & Entregas')
            .setEmoji('🛒')
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId('ticket_abrir_suporte')
            .setLabel('Suporte Geral')
            .setEmoji('🔎')
            .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
            .setCustomId('ticket_abrir_denuncia')
            .setLabel('Denúncias & Golpes')
            .setEmoji('🚨')
            .setStyle(ButtonStyle.Danger)
    );

    return { embeds: [embed], components: [row] };
}

/**
 * Gera payload do Painel de Tokens Oficial
 */
function gerarPainelTokensPayload() {
    const config = getTokensConfig();
    const unitPrice = Number(config.preco_por_1k || 18.50);
    const preco1kStr = unitPrice.toFixed(2).replace('.', ',');

    function calcPrice(qtd) {
        return 'R$ ' + ((qtd / 1000) * unitPrice).toFixed(2).replace('.', ',');
    }

    const embed = criarEmbedPadrao(TOKEN_EMOJI_STR + ' Central de Tokens • Kensai Store')
        .setDescription(
            'Adquira **Tokens** oficiais com entrega instantânea e pagamento facilitado via Pix!\n\n' +
            '💵 **Cotação Atual:** `R$ ' + preco1kStr + '` a cada **1.000 Tokens**\n\n' +
            'Selecione uma das opções no menu abaixo ou clique no botão para comprar uma quantia personalizada:\n\n' +
            '• 📦 **Quantidades Menores:** 100, 250, 500 ou 750 Tokens\n' +
            '• 📦 **Quantidades Padrão:** 1k, 2k, 3k ou 5k Tokens\n' +
            '• 📦 **Grandes Quantidades:** 10k, 20k, 50k ou 100k Tokens'
        )
        .addFields(
            { name: TOKEN_EMOJI_STR + ' 100 Tokens', value: calcPrice(100), inline: true },
            { name: TOKEN_EMOJI_STR + ' 500 Tokens', value: calcPrice(500), inline: true },
            { name: TOKEN_EMOJI_STR + ' 1.000 Tokens', value: calcPrice(1000), inline: true },
            { name: TOKEN_EMOJI_STR + ' 5.000 Tokens', value: calcPrice(5000), inline: true },
            { name: TOKEN_EMOJI_STR + ' 10.000 Tokens', value: calcPrice(10000), inline: true },
            { name: TOKEN_EMOJI_STR + ' 50.000 Tokens', value: calcPrice(50000), inline: true }
        )
        .setFooter({ text: 'Kensai Store • Sistema de Tokens Oficial' });

    const select = new StringSelectMenuBuilder()
        .setCustomId('token_comprar_select')
        .setPlaceholder('Escolha a quantidade de Tokens desejada...')
        .addOptions([
            { label: '100 Tokens', description: 'Valor: ' + calcPrice(100), value: '100', emoji: TOKEN_EMOJI_OBJ },
            { label: '250 Tokens', description: 'Valor: ' + calcPrice(250), value: '250', emoji: TOKEN_EMOJI_OBJ },
            { label: '500 Tokens', description: 'Valor: ' + calcPrice(500), value: '500', emoji: TOKEN_EMOJI_OBJ },
            { label: '750 Tokens', description: 'Valor: ' + calcPrice(750), value: '750', emoji: TOKEN_EMOJI_OBJ },
            { label: '1.000 Tokens', description: 'Valor: ' + calcPrice(1000), value: '1000', emoji: TOKEN_EMOJI_OBJ },
            { label: '2.000 Tokens', description: 'Valor: ' + calcPrice(2000), value: '2000', emoji: TOKEN_EMOJI_OBJ },
            { label: '3.000 Tokens', description: 'Valor: ' + calcPrice(3000), value: '3000', emoji: TOKEN_EMOJI_OBJ },
            { label: '5.000 Tokens', description: 'Valor: ' + calcPrice(5000), value: '5000', emoji: TOKEN_EMOJI_OBJ },
            { label: '10.000 Tokens', description: 'Valor: ' + calcPrice(10000), value: '10000', emoji: TOKEN_EMOJI_OBJ },
            { label: '20.000 Tokens', description: 'Valor: ' + calcPrice(20000), value: '20000', emoji: TOKEN_EMOJI_OBJ },
            { label: '50.000 Tokens', description: 'Valor: ' + calcPrice(50000), value: '50000', emoji: TOKEN_EMOJI_OBJ },
            { label: '100.000 Tokens', description: 'Valor: ' + calcPrice(100000), value: '100000', emoji: TOKEN_EMOJI_OBJ }
        ]);

    const rowSelect = new ActionRowBuilder().addComponents(select);
    const rowButton = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('token_comprar_custom')
            .setLabel('Quantidade Personalizada (a partir de 50 tokens)')
            .setEmoji(TOKEN_EMOJI_ID)
            .setStyle(ButtonStyle.Secondary)
    );

    return { embeds: [embed], components: [rowSelect, rowButton] };
}

/**
 * Gera payload do Painel de Itens Oficial
 */
function gerarPainelItensPayload() {
    const config = getItensConfig();
    const itens = config.itens || [];

    const embed = criarEmbedPadrao('⚔️ Catálogo de Itens • Kensai Store')
        .setDescription(
            'Explore e adquira nossos itens exclusivos, katanas, sets e passes especiais!\n\n' +
            'Selecione um item no menu abaixo para abrir seu carrinho e falar diretamente com nossa equipe de entrega:'
        )
        .setFooter({ text: 'Kensai Store • Catálogo Oficial' });

    itens.forEach(function(item) {
        embed.addFields({
            name: '⚔️ ' + item.nome + ' — ' + item.preco,
            value: item.descricao || 'Sem descrição detalhada.',
            inline: false
        });
    });

    const selectOptions = itens.slice(0, 25).map(function(item) {
        return {
            label: item.nome.slice(0, 100),
            description: (item.preco + ' • ' + (item.descricao || '')).slice(0, 100),
            value: item.id,
            emoji: '⚔️'
        };
    });

    if (selectOptions.length === 0) {
        selectOptions.push({
            label: 'Nenhum item cadastrado',
            description: 'Configure itens usando /config itens',
            value: 'vazio'
        });
    }

    const select = new StringSelectMenuBuilder()
        .setCustomId('item_comprar_select')
        .setPlaceholder('Selecione o item que deseja comprar...')
        .addOptions(selectOptions);

    const row = new ActionRowBuilder().addComponents(select);
    return { embeds: [embed], components: [row] };
}

module.exports = {
    TOKEN_EMOJI_ID,
    TOKEN_EMOJI_STR,
    TOKEN_EMOJI_OBJ,
    gerarPainelSuportePayload,
    gerarPainelTokensPayload,
    gerarPainelItensPayload
};
