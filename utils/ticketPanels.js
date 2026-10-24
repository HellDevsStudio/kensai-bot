const { gerarPainelItensPayload: gerarPainelItensKensai } = require('./renderItensPanel');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const { criarEmbedPadrao } = require('./embeds');
const { getSuporteConfig, getTokensConfig, getItensConfig, getSpinsPassesConfig } = require('./ticketConfigs');

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
    const unitPrice = Number(config.preco_por_1k !== undefined ? config.preco_por_1k : 18.00);
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
function gerarPainelItensPayload(guild) {
    return gerarPainelItensKensai(guild);
}


/**
 * Gera payload do Painel de Spins & Passes Oficial
 */
function gerarPainelSpinsPassesPayload() {
    const config = getSpinsPassesConfig();
    const produtos = config.produtos || [];

    const spins = produtos.filter(p => p.tipo === 'spin');
    const passes = produtos.filter(p => p.tipo === 'passe');

    function formatPrice(p) {
        if (typeof p.preco === 'number') {
            return 'R$ ' + p.preco.toFixed(2).replace('.', ',');
        }
        const num = parseFloat(String(p.preco).replace(',', '.'));
        if (!isNaN(num)) {
            return 'R$ ' + num.toFixed(2).replace('.', ',');
        }
        return String(p.preco || 'A Combinar');
    }

    const embed = criarEmbedPadrao('🌀 Central de Spins & Passes • Kensai Store')
        .setDescription(
            'Adquira **Spins** e **Passes VIP / Battlepass** oficiais com entrega rápida e pagamento facilitado via Pix!\n\n' +
            'Confira os valores na tabela abaixo e selecione a opção desejada no menu suspenso para abrir seu atendimento imediato:'
        );

    const primeiroTipo = produtos.length > 0 ? produtos[0].tipo : 'spin';
    const spinsList = spins.map(s => '• ' + (s.emoji || '🌀') + ' **' + s.nome + ':** `' + formatPrice(s) + '`').join('\n');
    const passesList = passes.map(p => '• ' + (p.emoji || '🎟️') + ' **' + p.nome + ':** `' + formatPrice(p) + '`').join('\n');

    if (primeiroTipo === 'passe') {
        if (passes.length > 0) {
            embed.addFields({ name: '🎟️ Passes & Gamepasses Oficiais', value: passesList, inline: false });
        }
        if (spins.length > 0) {
            embed.addFields({ name: '🌀 Pacotes de Spins (Blade Ball)', value: spinsList, inline: false });
        }
    } else {
        if (spins.length > 0) {
            embed.addFields({ name: '🌀 Pacotes de Spins (Blade Ball)', value: spinsList, inline: false });
        }
        if (passes.length > 0) {
            embed.addFields({ name: '🎟️ Passes & Gamepasses Oficiais', value: passesList, inline: false });
        }
    }

    embed.addFields({
        name: '📌 Como Funciona a Compra',
        value: '1. Selecione o pacote desejado no menu suspenso abaixo;\n' +
               '2. Um canal de atendimento privado será criado para você com a chave Pix e instruções;\n' +
               '3. Envie o comprovante e seu Nick do jogo para a Staff realizar a entrega imediata!',
        inline: false
    });

    embed.setFooter({ text: 'Kensai Store • Sistema Oficial de Spins & Passes' });

    const selectOptions = produtos.map(p => ({
        label: p.nome.substring(0, 50),
        value: p.id,
        description: ('Valor: ' + formatPrice(p) + (p.descricao ? ' • ' + p.descricao : '')).substring(0, 100),
        emoji: p.emoji || (p.tipo === 'spin' ? '🌀' : '🎟️')
    }));

    const select = new StringSelectMenuBuilder()
        .setCustomId('spins_passes_select')
        .setPlaceholder('Escolha o pacote de Spins ou Passe desejado...')
        .addOptions(selectOptions);

    const rowSelect = new ActionRowBuilder().addComponents(select);

    return { embeds: [embed], components: [rowSelect] };
}

module.exports = {
    TOKEN_EMOJI_ID,
    TOKEN_EMOJI_STR,
    TOKEN_EMOJI_OBJ,
    gerarPainelSuportePayload,
    gerarPainelTokensPayload,
    gerarPainelItensPayload,
    gerarPainelSpinsPassesPayload
};
