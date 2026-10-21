const { ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const { criarEmbedPadrao } = require('./embeds');
const { getSuporteConfig, getTokensConfig, getItensConfig } = require('./ticketConfigs');

/**
 * Gera payload do Painel de Suporte Oficial
 */
function gerarPainelSuportePayload() {
    const config = getSuporteConfig();
    const embed = criarEmbedPadrao('🎫 Central de Atendimento • Suporte')
        .setDescription(
            'Seja bem-vindo à Central de Atendimento da **Kensai Store**!\n\n' +
            'Precisa de suporte com compras, dúvidas sobre produtos, parcerias ou denúncias? ' +
            'Clique no botão abaixo para abrir seu canal privativo com nossa equipe.\n\n' +
            '• 🛡️ **Atendimento Privativo:** Somente você e nossa Staff têm acesso.\n' +
            '• 🕒 **Horário:** Conforme disponibilidade dos atendentes.\n' +
            '• 📝 **Histórico Seguro:** Todas as conversas são registradas em logs.'
        )
        .setFooter({ text: 'Kensai Store • Atendimento Oficial' });

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('ticket_abrir_suporte')
            .setLabel('🎫 Abrir Ticket de Suporte')
            .setStyle(ButtonStyle.Primary)
    );

    return { embeds: [embed], components: [row] };
}

/**
 * Gera payload do Painel de Tokens Oficial
 */
function gerarPainelTokensPayload() {
    const config = getTokensConfig();
    const preco1k = Number(config.preco_por_1k || 18.50).toFixed(2).replace('.', ',');

    const embed = criarEmbedPadrao('💰 Central de Tokens • Kensai Store')
        .setDescription(
            'Adquira Tokens oficiais com entrega rápida e pagamento facilitado via Pix!\n\n' +
            '💵 **Cotação Atual:** `R$ ' + preco1k + '` a cada **1.000 Tokens**\n\n' +
            'Selecione uma das opções no menu abaixo ou clique no botão para comprar uma quantia personalizada:'
        )
        .addFields(
            { name: '🪙 1.000 Tokens', value: 'R$ ' + preco1k, inline: true },
            { name: '🪙 3.000 Tokens', value: 'R$ ' + (Number(config.preco_por_1k) * 3).toFixed(2).replace('.', ','), inline: true },
            { name: '🪙 5.000 Tokens', value: 'R$ ' + (Number(config.preco_por_1k) * 5).toFixed(2).replace('.', ','), inline: true }
        )
        .setFooter({ text: 'Kensai Store • Sistema de Tokens' });

    const select = new StringSelectMenuBuilder()
        .setCustomId('token_comprar_select')
        .setPlaceholder('Escolha a quantidade de Tokens...')
        .addOptions([
            { label: '1.000 Tokens', description: 'Valor: R$ ' + preco1k, value: '1000', emoji: '🪙' },
            { label: '3.000 Tokens', description: 'Valor: R$ ' + (Number(config.preco_por_1k) * 3).toFixed(2).replace('.', ','), value: '3000', emoji: '🪙' },
            { label: '5.000 Tokens', description: 'Valor: R$ ' + (Number(config.preco_por_1k) * 5).toFixed(2).replace('.', ','), value: '5000', emoji: '🪙' },
            { label: '10.000 Tokens', description: 'Valor: R$ ' + (Number(config.preco_por_1k) * 10).toFixed(2).replace('.', ','), value: '10000', emoji: '🪙' }
        ]);

    const rowSelect = new ActionRowBuilder().addComponents(select);
    const rowButton = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('token_comprar_custom')
            .setLabel('✨ Quantidade Personalizada')
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
    gerarPainelSuportePayload,
    gerarPainelTokensPayload,
    gerarPainelItensPayload
};
