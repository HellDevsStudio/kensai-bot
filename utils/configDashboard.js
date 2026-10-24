const { 
    listarProdutosSpins, 
    formatarPrecoProduto, 
    adicionarProdutoSpins, 
    removerProdutoSpins, 
    atualizarPrecoSpins 
} = require('./spinsManager');
const { 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    ChannelSelectMenuBuilder,
    StringSelectMenuBuilder, 
    RoleSelectMenuBuilder, 
    ChannelType, 
    ModalBuilder, 
    TextInputBuilder, 
    TextInputStyle, 
    MessageFlags 
} = require('discord.js');
const { criarEmbedPadrao } = require('./embeds');
const { lerEstoque } = require('./itemControl');
const { 
    getSuporteConfig, setSuporteConfig, 
    getTokensConfig, setTokensConfig, 
    getItensConfig, setItensConfig,
    getSpinsPassesConfig, setSpinsPassesConfig
} = require('./ticketConfigs');
const { 
    gerarPainelSuportePayload, 
    gerarPainelTokensPayload, 
    gerarPainelItensPayload,
    gerarPainelSpinsPassesPayload
} = require('./ticketPanels');

/**
 * 1. Painel Principal (Menu inicial)
 */
function gerarPainelPrincipal(statusNotice) {
    const sup = getSuporteConfig();
    const tok = getTokensConfig();
    const itn = getItensConfig();

    const embed = criarEmbedPadrao('⚙️ Painel Central de Configurações • Kensai Store')
        .setDescription(
            (statusNotice ? statusNotice + '\n\n' : '') +
            'Bem-vindo à **Central de Configurações da Kensai Store**!\n\n' +
            'Aqui você pode gerenciar canais, categorias, cargos de atendimento, preços e a chave Pix de forma **100% interativa pelos botões e menus** abaixo, sem precisar de comandos complexos.\n\n' +
            '📁 *As alterações são salvas automaticamente em `data/configs/`.*'
        )
        .addFields(
            {
                name: '🎫 1. Suporte Geral (`suporte.json`)',
                value: '• **Categoria:** ' + (sup.categoria_id ? '<#' + sup.categoria_id + '>' : '❌ *Não configurada*') + '\n' +
                       '• **Canal de Logs:** ' + (sup.canal_logs_id ? '<#' + sup.canal_logs_id + '>' : '❌ *Não configurado*') + '\n' +
                       '• **Cargo Staff:** ' + (sup.cargo_staff_id ? '<@&' + sup.cargo_staff_id + '>' : '❌ *Não configurado*'),
                inline: false
            },
            {
                name: '💰 2. Compra de Tokens (`tokens.json`)',
                value: '• **Preço por 1.000:** `R$ ' + Number(tok.preco_por_1k !== undefined ? tok.preco_por_1k : 18).toFixed(2).replace('.', ',') + '`\n' +
                       '• **Chave Pix:** `' + (tok.chave_pix || '❌ Não configurada') + '`\n' +
                       '• **Categoria:** ' + (tok.categoria_id ? '<#' + tok.categoria_id + '>' : '❌ *Não configurada*') + '\n' +
                       '• **Canal de Logs:** ' + (tok.canal_logs_id ? '<#' + tok.canal_logs_id + '>' : '❌ *Não configurado*') + '\n' +
                       '• **Cargo Staff:** ' + (tok.cargo_staff_id ? '<@&' + tok.cargo_staff_id + '>' : '❌ *Não configurado*'),
                inline: false
            },
            {
                name: '⚔️ 3. Arsenal de Itens Blade Ball (`estoque.json`)',
                value: (() => {
                    const estoque = typeof lerEstoque === 'function' ? lerEstoque() : [];
                    const totalUnidades = estoque.reduce((acc, i) => acc + (Number(i.quantidade) || 0), 0);
                    return '• **Estoque Ativo:** `' + estoque.length + ' produtos cadastrados (' + totalUnidades + ' unid.)`\n' +
                           '• **Categoria:** ' + (itn.categoria_id ? '<#' + itn.categoria_id + '>' : '❌ *Não configurada*') + '\n' +
                           '• **Canal de Logs:** ' + (itn.canal_logs_id ? '<#' + itn.canal_logs_id + '>' : '❌ *Não configurado*') + '\n' +
                           '• **Cargo Staff:** ' + (itn.cargo_staff_id ? '<@&' + itn.cargo_staff_id + '>' : '❌ *Não configurado*');
                })(),
                inline: false
            },
            {
                name: '🌀 4. Spins & Passes (`spins_passes.json`)',
                value: (() => {
                    const spn = getSpinsPassesConfig();
                    const prods = spn.produtos || [];
                    return '• **Catálogo Fixo:** `' + prods.length + ' pacotes e passes cadastrados`\n' +
                           '• **Categoria:** ' + (spn.categoria_id ? '<#' + spn.categoria_id + '>' : '❌ *Não configurada*') + '\n' +
                           '• **Canal de Logs:** ' + (spn.canal_logs_id ? '<#' + spn.canal_logs_id + '>' : '❌ *Não configurado*') + '\n' +
                           '• **Cargo Staff:** ' + (spn.cargo_staff_id ? '<@&' + spn.cargo_staff_id + '>' : '❌ *Não configurado*');
                })(),
                inline: false
            }
        )
        .setFooter({ text: 'Clique nos botões abaixo para configurar ou enviar os painéis' });

    const rowNav = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('cfg_nav_suporte')
            .setLabel('Suporte')
            .setEmoji('🎫')
            .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
            .setCustomId('cfg_nav_tokens')
            .setLabel('Tokens')
            .setEmoji('💰')
            .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
            .setCustomId('cfg_nav_spins')
            .setLabel('Spins & Passes')
            .setEmoji('🌀')
            .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
            .setCustomId('cfg_nav_itens')
            .setLabel('Itens')
            .setEmoji('⚔️')
            .setStyle(ButtonStyle.Primary)
    );

    const rowAcoes = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('cfg_nav_paineis')
            .setLabel('Despachar Painéis no Canal')
            .setEmoji('📢')
            .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
            .setCustomId('cfg_btn_refresh')
            .setLabel('Atualizar Dados')
            .setEmoji('🔄')
            .setStyle(ButtonStyle.Secondary)
    );

    return { embeds: [embed], components: [rowNav, rowAcoes] };
}

/**
 * 2. Painel Interativo de Suporte
 */
function gerarPainelSuporteConfig(statusNotice) {
    const sup = getSuporteConfig();

    const embed = criarEmbedPadrao('⚙️ Configuração • Sistema de Suporte')
        .setDescription(
            (statusNotice ? statusNotice + '\n\n' : '') +
            'Defina abaixo as configurações para o atendimento de **Suporte Geral** utilizando os menus interativos:\n\n' +
            '📁 **Categoria Atual:** ' + (sup.categoria_id ? '<#' + sup.categoria_id + '>' : '❌ *Nenhuma*') + '\n' +
            '📜 **Canal de Logs Atual:** ' + (sup.canal_logs_id ? '<#' + sup.canal_logs_id + '>' : '❌ *Nenhum*') + '\n' +
            '🛡️ **Cargo Staff Atual:** ' + (sup.cargo_staff_id ? '<@&' + sup.cargo_staff_id + '>' : '❌ *Nenhum*')
        )
        .setFooter({ text: 'Selecione as opções nos menus abaixo para alterar instantaneamente' });

    const rowCat = new ActionRowBuilder().addComponents(
        new ChannelSelectMenuBuilder()
            .setCustomId('cfg_sel_sup_cat')
            .setPlaceholder('📁 Selecione a Categoria de Suporte...')
            .setChannelTypes(ChannelType.GuildCategory)
    );

    const rowLogs = new ActionRowBuilder().addComponents(
        new ChannelSelectMenuBuilder()
            .setCustomId('cfg_sel_sup_logs')
            .setPlaceholder('📜 Selecione o Canal de Logs de Suporte...')
            .setChannelTypes(ChannelType.GuildText)
    );

    const rowRole = new ActionRowBuilder().addComponents(
        new RoleSelectMenuBuilder()
            .setCustomId('cfg_sel_sup_role')
            .setPlaceholder('🛡️ Selecione o Cargo da Staff de Suporte...')
    );

    const rowBotoes = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('cfg_send_panel_suporte')
            .setLabel('Enviar Painel de Suporte Aqui')
            .setEmoji('📢')
            .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
            .setCustomId('cfg_nav_home')
            .setLabel('Voltar ao Menu')
            .setEmoji('⬅️')
            .setStyle(ButtonStyle.Secondary)
    );

    return { embeds: [embed], components: [rowCat, rowLogs, rowRole, rowBotoes] };
}

/**
 * 3. Painel Interativo de Tokens
 */
function gerarPainelTokensConfig(statusNotice) {
    const tok = getTokensConfig();

    const embed = criarEmbedPadrao('⚙️ Configuração • Sistema de Tokens')
        .setDescription(
            (statusNotice ? statusNotice + '\n\n' : '') +
            'Configure os parâmetros de venda, preços e pagamentos de **Tokens**:\n\n' +
            '💵 **Preço por 1.000:** `R$ ' + Number(tok.preco_por_1k || 18.5).toFixed(2).replace('.', ',') + '`\n' +
            '🔑 **Chave Pix:** `' + (tok.chave_pix || '❌ Não configurada') + '`\n' +
            '📁 **Categoria Atual:** ' + (tok.categoria_id ? '<#' + tok.categoria_id + '>' : '❌ *Nenhuma*') + '\n' +
            '📜 **Canal de Logs Atual:** ' + (tok.canal_logs_id ? '<#' + tok.canal_logs_id + '>' : '❌ *Nenhum*') + '\n' +
            '🛡️ **Cargo Staff Atual:** ' + (tok.cargo_staff_id ? '<@&' + tok.cargo_staff_id + '>' : '❌ *Nenhum*')
        )
        .setFooter({ text: 'Clique em Alterar Preço & Pix para abrir o formulário' });

    const rowBotoes = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('cfg_open_modal_tokens')
            .setLabel('Alterar Preço 1k & Chave Pix')
            .setEmoji('💵')
            .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
            .setCustomId('cfg_send_panel_tokens')
            .setLabel('Enviar Painel de Tokens Aqui')
            .setEmoji('📢')
            .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
            .setCustomId('cfg_nav_home')
            .setLabel('Voltar ao Menu')
            .setEmoji('⬅️')
            .setStyle(ButtonStyle.Secondary)
    );

    const rowCat = new ActionRowBuilder().addComponents(
        new ChannelSelectMenuBuilder()
            .setCustomId('cfg_sel_tok_cat')
            .setPlaceholder('📁 Selecione a Categoria dos Tickets de Tokens...')
            .setChannelTypes(ChannelType.GuildCategory)
    );

    const rowLogs = new ActionRowBuilder().addComponents(
        new ChannelSelectMenuBuilder()
            .setCustomId('cfg_sel_tok_logs')
            .setPlaceholder('📜 Selecione o Canal de Logs de Tokens...')
            .setChannelTypes(ChannelType.GuildText)
    );

    const rowRole = new ActionRowBuilder().addComponents(
        new RoleSelectMenuBuilder()
            .setCustomId('cfg_sel_tok_role')
            .setPlaceholder('🛡️ Selecione o Cargo de Vendas de Tokens...')
    );

    return { embeds: [embed], components: [rowBotoes, rowCat, rowLogs, rowRole] };
}

/**
 * 4. Painel Interativo de Itens
 */
function gerarPainelItensConfig(statusNotice) {
    const itn = getItensConfig();
    const estoque = typeof lerEstoque === 'function' ? lerEstoque() : [];
    const totalUnidades = estoque.reduce((acc, i) => acc + (Number(i.quantidade) || 0), 0);

    const embed = criarEmbedPadrao('⚔️ Configuração • Arsenal de Itens Blade Ball')
        .setDescription(
            (statusNotice ? statusNotice + '\n\n' : '') +
            'Defina onde os tickets do **Arsenal de Blade Ball (Kensai Store)** serão abertos e registrados:\n\n' +
            '⚔️ **Estoque Atual:** `' + estoque.length + ' itens cadastrados (' + totalUnidades + ' unidades disponíveis)`\n' +
            '📁 **Categoria Atual:** ' + (itn.categoria_id ? '<#' + itn.categoria_id + '>' : '❌ *Nenhuma*') + '\n' +
            '📜 **Canal de Logs Atual:** ' + (itn.canal_logs_id ? '<#' + itn.canal_logs_id + '>' : '❌ *Nenhum*') + '\n' +
            '🛡️ **Cargo Staff Atual:** ' + (itn.cargo_staff_id ? '<@&' + itn.cargo_staff_id + '>' : '❌ *Nenhum*') + '\n\n' +
            '💡 *Use os menus abaixo para selecionar os canais/cargos e o botão para fixar o painel para os clientes:*'
        )
        .setFooter({ text: 'Kensai Store • Sistema Oficial de Arsenal Blade Ball' });

    const rowCat = new ActionRowBuilder().addComponents(
        new ChannelSelectMenuBuilder()
            .setCustomId('cfg_sel_itn_cat')
            .setPlaceholder('📁 Selecione a Categoria dos Tickets de Itens...')
            .setChannelTypes(ChannelType.GuildCategory)
    );

    const rowLogs = new ActionRowBuilder().addComponents(
        new ChannelSelectMenuBuilder()
            .setCustomId('cfg_sel_itn_logs')
            .setPlaceholder('📜 Selecione o Canal de Logs de Itens...')
            .setChannelTypes(ChannelType.GuildText)
    );

    const rowRole = new ActionRowBuilder().addComponents(
        new RoleSelectMenuBuilder()
            .setCustomId('cfg_sel_itn_role')
            .setPlaceholder('🛡️ Selecione o Cargo de Entrega de Itens...')
    );

    const rowBotoes = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('cfg_send_panel_itens')
            .setLabel('Enviar Arsenal de Itens Aqui')
            .setEmoji('⚔️')
            .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
            .setCustomId('cfg_btn_guia_itens')
            .setLabel('Guia de Comandos & Estoque')
            .setEmoji('📦')
            .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
            .setCustomId('cfg_nav_home')
            .setLabel('Voltar ao Menu')
            .setEmoji('⬅️')
            .setStyle(ButtonStyle.Secondary)
    );

    return { embeds: [embed], components: [rowCat, rowLogs, rowRole, rowBotoes] };
}


/**
 * 4.1 Painel Interativo de Configuração de Spins & Passes
 */
function gerarPainelSpinsConfig(statusNotice) {
    const spn = getSpinsPassesConfig();
    const produtos = spn.produtos || [];

    const spins = produtos.filter(p => p.tipo === 'spin');
    const passes = produtos.filter(p => p.tipo === 'passe');

    let tabelaSpins = spins.length > 0
        ? spins.map(p => '• ' + (p.emoji || '🌀') + ' **' + p.nome + ':** `' + formatarPrecoProduto(p.preco) + '`').join('\n')
        : '*(Nenhum pacote de spins cadastrado)*';

    let tabelaPasses = passes.length > 0
        ? passes.map(p => '• ' + (p.emoji || '🎟️') + ' **' + p.nome + ':** `' + formatarPrecoProduto(p.preco) + '`').join('\n')
        : '*(Nenhum passe cadastrado)*';

    const embed = criarEmbedPadrao('⚙️ Configuração • Spins & Passes')
        .setDescription(
            (statusNotice ? statusNotice + '\n\n' : '') +
            'Gerencie pacotes de **Spins e Passes**, adicione ou remova itens e configure os canais de atendimento:\n\n' +
            '📁 **Categoria Atual:** ' + (spn.categoria_id ? '<#' + spn.categoria_id + '>' : '❌ *Não configurada*') + '\n' +
            '📜 **Canal de Logs Atual:** ' + (spn.canal_logs_id ? '<#' + spn.canal_logs_id + '>' : '❌ *Não configurado*') + '\n' +
            '🛡️ **Cargo Staff Atual:** ' + (spn.cargo_staff_id ? '<@&' + spn.cargo_staff_id + '>' : '❌ *Não configurado*') + '\n' +
            '🔑 **Chave Pix Oficial:** `' + (spn.chave_pix || 'kensai.store.oficial@gmail.com') + '`\n\n' +
            '🌀 **Pacotes de Spins:**\n' + tabelaSpins + '\n\n' +
            '🎟️ **Passes & Gamepasses:**\n' + tabelaPasses + '\n\n' +
            '💡 *Use os botões abaixo para colocar novos itens, remover existentes ou alterar preços:*'
        )
        .setFooter({ text: 'Kensai Store • Gestão Completa de Spins & Passes' });

    // Linha 1: Ações de Catálogo (Adicionar, Remover, Alterar Preço, Organizar Ordem)
    const rowAcoesCatalogo = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('cfg_btn_spins_add')
            .setLabel('Adicionar Item')
            .setEmoji('➕')
            .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
            .setCustomId('cfg_btn_spins_rem_mode')
            .setLabel('Remover Item')
            .setEmoji('🗑️')
            .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
            .setCustomId('cfg_btn_spins_price_mode')
            .setLabel('Alterar Preço')
            .setEmoji('💵')
            .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
            .setCustomId('cfg_btn_spins_reorder_mode')
            .setLabel('Organizar Ordem')
            .setEmoji('🔃')
            .setStyle(ButtonStyle.Secondary)
    );

    // Linha 2: Categoria
    const rowCat = new ActionRowBuilder().addComponents(
        new ChannelSelectMenuBuilder()
            .setCustomId('cfg_sel_spins_cat')
            .setPlaceholder('📁 Selecione a Categoria dos Tickets de Spins/Passes...')
            .setChannelTypes(ChannelType.GuildCategory)
    );

    // Linha 3: Logs
    const rowLogs = new ActionRowBuilder().addComponents(
        new ChannelSelectMenuBuilder()
            .setCustomId('cfg_sel_spins_logs')
            .setPlaceholder('📜 Selecione o Canal de Logs de Spins/Passes...')
            .setChannelTypes(ChannelType.GuildText)
    );

    // Linha 4: Cargo Staff
    const rowRole = new ActionRowBuilder().addComponents(
        new RoleSelectMenuBuilder()
            .setCustomId('cfg_sel_spins_role')
            .setPlaceholder('🛡️ Selecione o Cargo da Staff de Spins/Passes...')
    );

    // Linha 5: Enviar Painel & Voltar
    const rowBotoes = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('cfg_send_panel_spins')
            .setLabel('Enviar Painel de Spins & Passes Aqui')
            .setEmoji('📢')
            .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
            .setCustomId('cfg_nav_home')
            .setLabel('Voltar ao Menu')
            .setEmoji('⬅️')
            .setStyle(ButtonStyle.Secondary)
    );

    return { embeds: [embed], components: [rowAcoesCatalogo, rowCat, rowLogs, rowRole, rowBotoes] };
}

/**
 * 4.2 Tela para Remover Item do Painel de Spins & Passes
 */
function gerarPainelSpinsRemover(statusNotice) {
    const spn = getSpinsPassesConfig();
    const produtos = spn.produtos || [];

    const embed = criarEmbedPadrao('🗑️ Remover Item • Spins & Passes')
        .setDescription(
            (statusNotice ? statusNotice + '\n\n' : '') +
            'Selecione no menu abaixo o pacote ou passe que deseja **remover do catálogo**:\n\n' +
            (produtos.length > 0
                ? produtos.map(p => '• ' + (p.emoji || '🌀') + ' **' + p.nome + ':** `' + formatarPrecoProduto(p.preco) + '`').join('\n')
                : '⚠️ *Nenhum item cadastrado no momento.*')
        )
        .setFooter({ text: 'O item será excluído e o painel público será sincronizado na hora' });

    const components = [];
    if (produtos.length > 0) {
        const selectRemover = new StringSelectMenuBuilder()
            .setCustomId('cfg_sel_spins_delete_item')
            .setPlaceholder('🗑️ Selecione o item que deseja excluir...')
            .addOptions(produtos.map(p => ({
                label: p.nome.substring(0, 50),
                value: p.id,
                description: ('Preço: ' + formatarPrecoProduto(p.preco)).substring(0, 50),
                emoji: '🗑️'
            })));
        components.push(new ActionRowBuilder().addComponents(selectRemover));
    }

    const rowVoltar = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('cfg_nav_spins')
            .setLabel('Cancelar e Voltar')
            .setEmoji('⬅️')
            .setStyle(ButtonStyle.Secondary)
    );
    components.push(rowVoltar);

    return { embeds: [embed], components };
}

/**
 * 4.3 Tela para Selecionar Item e Alterar Preço
 */
function gerarPainelSpinsPreco(statusNotice) {
    const spn = getSpinsPassesConfig();
    const produtos = spn.produtos || [];

    const embed = criarEmbedPadrao('💵 Alterar Preço • Spins & Passes')
        .setDescription(
            (statusNotice ? statusNotice + '\n\n' : '') +
            'Selecione no menu abaixo o item que deseja atualizar o preço de venda:\n\n' +
            (produtos.length > 0
                ? produtos.map(p => '• ' + (p.emoji || '🌀') + ' **' + p.nome + ':** `' + formatarPrecoProduto(p.preco) + '`').join('\n')
                : '⚠️ *Nenhum item cadastrado no momento.*')
        )
        .setFooter({ text: 'Ao selecionar, abrirá o formulário para você definir o novo preço' });

    const components = [];
    if (produtos.length > 0) {
        const selectPreco = new StringSelectMenuBuilder()
            .setCustomId('cfg_sel_spins_change_price')
            .setPlaceholder('💵 Selecione o item para alterar o preço...')
            .addOptions(produtos.map(p => ({
                label: p.nome.substring(0, 50),
                value: p.id,
                description: ('Preço atual: ' + formatarPrecoProduto(p.preco)).substring(0, 50),
                emoji: p.emoji || (p.tipo === 'spin' ? '🌀' : '🎟️')
            })));
        components.push(new ActionRowBuilder().addComponents(selectPreco));
    }

    const rowVoltar = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('cfg_nav_spins')
            .setLabel('Voltar')
            .setEmoji('⬅️')
            .setStyle(ButtonStyle.Secondary)
    );
    components.push(rowVoltar);

    return { embeds: [embed], components };
}

/**
 * 5. Painel de Despacho Rápido de Painéis
 */
function gerarPainelDespachoPaineis(statusNotice) {
    const embed = criarEmbedPadrao('📢 Despacho de Painéis Oficiais • Kensai Store')
        .setDescription(
            (statusNotice ? statusNotice + '\n\n' : '') +
            'Clique no botão abaixo para fixar o painel oficial desejado diretamente **neste canal**:\n\n' +
            '• **🎫 Painel de Suporte:** Botão para abertura de dúvidas e denúncias.\n' +
            '• **💰 Painel de Tokens:** Dropdown com pacotes rápidos + botão de quantia customizada.\n' +
            '• **🌀 Painel de Spins & Passes:** Dropdown com pacotes de spins e gamepasses.\n' +
            '• **⚔️ Catálogo de Itens:** Dropdown de compra direta de produtos da loja.'
        )
        .setFooter({ text: 'O painel será enviado como uma nova mensagem pública no canal' });

    const rowPaineis = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('cfg_send_panel_suporte')
            .setLabel('Suporte')
            .setEmoji('🎫')
            .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
            .setCustomId('cfg_send_panel_tokens')
            .setLabel('Tokens')
            .setEmoji('💰')
            .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
            .setCustomId('cfg_send_panel_spins')
            .setLabel('Spins/Passes')
            .setEmoji('🌀')
            .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
            .setCustomId('cfg_send_panel_itens')
            .setLabel('Itens')
            .setEmoji('⚔️')
            .setStyle(ButtonStyle.Success)
    );

    const rowVoltar = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('cfg_nav_home')
            .setLabel('Voltar ao Menu Principal')
            .setEmoji('⬅️')
            .setStyle(ButtonStyle.Secondary)
    );

    return { embeds: [embed], components: [rowPaineis, rowVoltar] };
}

/**
 * 6. Modal para alterar Preço e Chave Pix de Tokens
 */
function gerarModalConfigTokens() {
    const tok = getTokensConfig();
    const modal = new ModalBuilder()
        .setCustomId('modal_cfg_tokens')
        .setTitle('Configurar Preço & Chave Pix');

    const currentPreco = tok.preco_por_1k !== undefined ? tok.preco_por_1k : 18;
    const inputPreco = new TextInputBuilder()
        .setCustomId('cfg_input_preco_1k')
        .setLabel('Preço por 1.000 tokens (R$):')
        .setValue(String(currentPreco))
        .setPlaceholder('Ex: 18.00 ou 18')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

    const currentPix = tok.chave_pix || 'kensai.store.oficial@gmail.com';
    const inputPix = new TextInputBuilder()
        .setCustomId('cfg_input_chave_pix')
        .setLabel('Chave Pix da loja:')
        .setValue(String(currentPix))
        .setPlaceholder('Ex: kensai.store.oficial@gmail.com')
        .setStyle(TextInputStyle.Short)
        .setRequired(false);

    modal.addComponents(
        new ActionRowBuilder().addComponents(inputPreco),
        new ActionRowBuilder().addComponents(inputPix)
    );

    return modal;
}

/**
 * Handler central de todas as interações do painel de configuração
 */

/**
 * 4.4 Tela para Reorganizar a Ordem dos Itens de Spins & Passes
 */
function gerarPainelSpinsOrdem(statusNotice, itemSelecionadoId) {
    const spn = getSpinsPassesConfig();
    const produtos = spn.produtos || [];

    const itemSel = itemSelecionadoId ? produtos.find(p => p.id === itemSelecionadoId) : null;
    const idx = itemSel ? produtos.findIndex(p => p.id === itemSelecionadoId) : -1;
    const posAtual = idx + 1;

    const listaNumerada = produtos.length > 0
        ? produtos.map((p, i) => {
            const marker = (itemSel && p.id === itemSel.id) ? '👉 ' : '';
            return marker + '**#' + (i + 1) + '** ' + (p.emoji || (p.tipo === 'spin' ? '🌀' : '🎟️')) + ' **' + p.nome + '** • `' + formatarPrecoProduto(p.preco) + '`';
        }).join('\n')
        : '*(Nenhum item cadastrado no momento)*';

    const embed = criarEmbedPadrao('🔃 Organização de Itens • Spins & Passes')
        .setDescription(
            (statusNotice ? statusNotice + '\n\n' : '') +
            'Ajuste a ordem em que os pacotes de spins e passes aparecem no **painel público** e no **menu de compra**:\n\n' +
            '📋 **Ordem Atual dos Produtos:**\n' +
            listaNumerada + '\n\n' +
            (itemSel 
                ? '👉 **Item Selecionado:** ' + (itemSel.emoji || '') + ' **' + itemSel.nome + '** (Posição atual: **#' + posAtual + ' de ' + produtos.length + '**)\n*Use as setas abaixo para movimentar ou clique em uma organização rápida:*'
                : '💡 *Selecione um item no menu abaixo para subir/descer sua posição ou use os botões rápidos de ordenação:*'
            )
        )
        .setFooter({ text: 'Kensai Store • As alterações atualizam o painel público instantaneamente' });

    const components = [];

    // Linha 1: Dropdown para selecionar o item a ser movido
    if (produtos.length > 0) {
        const selectOptions = produtos.map((p, i) => ({
            label: ('(#' + (i + 1) + ') ' + p.nome).substring(0, 50),
            value: p.id,
            description: ('Tipo: ' + (p.tipo === 'spin' ? 'Spin' : 'Passe') + ' • Preço: ' + formatarPrecoProduto(p.preco)).substring(0, 50),
            emoji: p.emoji || (p.tipo === 'spin' ? '🌀' : '🎟️'),
            default: itemSel ? p.id === itemSel.id : false
        }));

        components.push(new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('cfg_sel_spins_order_pick')
                .setPlaceholder('🔽 Selecione um item para reposicionar...')
                .addOptions(selectOptions)
        ));
    }

    // Linha 2: Botões de Movimentação do Item Selecionado
    const rowMovimento = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('cfg_btn_spins_move_up_' + (itemSel ? itemSel.id : 'none'))
            .setLabel('Subir (▲)')
            .setEmoji('⬆️')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(!itemSel || idx === 0),
        new ButtonBuilder()
            .setCustomId('cfg_btn_spins_move_down_' + (itemSel ? itemSel.id : 'none'))
            .setLabel('Descer (▼)')
            .setEmoji('⬇️')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(!itemSel || idx === produtos.length - 1),
        new ButtonBuilder()
            .setCustomId('cfg_btn_spins_move_top_' + (itemSel ? itemSel.id : 'none'))
            .setLabel('Topo')
            .setEmoji('🔝')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(!itemSel || idx === 0),
        new ButtonBuilder()
            .setCustomId('cfg_btn_spins_move_bottom_' + (itemSel ? itemSel.id : 'none'))
            .setLabel('Fim')
            .setEmoji('🔚')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(!itemSel || idx === produtos.length - 1)
    );
    components.push(rowMovimento);

    // Linha 3: Presets de Organização Rápida
    const rowPresets = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('cfg_btn_spins_sort_spins_first')
            .setLabel('Spins Primeiro')
            .setEmoji('🌀')
            .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
            .setCustomId('cfg_btn_spins_sort_passes_first')
            .setLabel('Passes Primeiro')
            .setEmoji('🎟️')
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId('cfg_btn_spins_sort_price_asc')
            .setLabel('Menor Preço')
            .setEmoji('📉')
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId('cfg_btn_spins_sort_price_desc')
            .setLabel('Maior Preço')
            .setEmoji('📈')
            .setStyle(ButtonStyle.Secondary)
    );
    components.push(rowPresets);

    // Linha 4: Voltar
    const rowVoltar = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('cfg_nav_spins')
            .setLabel('Voltar ao Menu de Spins')
            .setEmoji('⬅️')
            .setStyle(ButtonStyle.Secondary)
    );
    components.push(rowVoltar);

    return { embeds: [embed], components };
}

async function handleConfigInteraction(interaction) {
    const { PermissionsBitField } = require('discord.js');
    const { checkPermission } = require('./permissions');

    // Checagem de permissão de administrador
    if (!checkPermission(interaction.member, PermissionsBitField.Flags.Administrator)) {
        return interaction.reply({
            content: '❌ Apenas administradores podem utilizar este painel de configuração.',
            flags: [MessageFlags.Ephemeral]
        });
    }

    const cid = interaction.customId;

    // A. NAVEGAÇÃO ENTRE TELAS DO PAINEL
    if (cid === 'cfg_nav_home') {
        return interaction.update(gerarPainelPrincipal());
    }
    if (cid === 'cfg_btn_refresh') {
        return interaction.update(gerarPainelPrincipal('🔄 **Painel atualizado com sucesso!**'));
    }
    if (cid === 'cfg_nav_suporte') {
        return interaction.update(gerarPainelSuporteConfig());
    }
    if (cid === 'cfg_nav_tokens') {
        return interaction.update(gerarPainelTokensConfig());
    }
    if (cid === 'cfg_nav_spins') {
        return interaction.update(gerarPainelSpinsConfig());
    }
    if (cid === 'cfg_nav_itens') {
        return interaction.update(gerarPainelItensConfig());
    }
    if (cid === 'cfg_nav_paineis') {
        return interaction.update(gerarPainelDespachoPaineis());
    }

    // B. MODAL DE PREÇO & PIX DOS TOKENS
    if (cid === 'cfg_open_modal_tokens') {
        return interaction.showModal(gerarModalConfigTokens());
    }

    // C. SELECTS DE CANAL & CARGO (SUPORTE)
    if (cid === 'cfg_sel_sup_cat') {
        const catId = interaction.values[0];
        setSuporteConfig({ categoria_id: catId });
        return interaction.update(gerarPainelSuporteConfig('✅ **Categoria de Suporte atualizada para <#' + catId + '>!**'));
    }
    if (cid === 'cfg_sel_sup_logs') {
        const logId = interaction.values[0];
        setSuporteConfig({ canal_logs_id: logId });
        return interaction.update(gerarPainelSuporteConfig('✅ **Canal de Logs de Suporte atualizado para <#' + logId + '>!**'));
    }
    if (cid === 'cfg_sel_sup_role') {
        const roleId = interaction.values[0];
        setSuporteConfig({ cargo_staff_id: roleId });
        return interaction.update(gerarPainelSuporteConfig('✅ **Cargo da Staff de Suporte atualizado para <@&' + roleId + '>!**'));
    }

    
    // D.1 SELECTS DE CANAL, CARGO E PREÇO (SPINS & PASSES)
    if (cid === 'cfg_sel_spins_cat') {
        const catId = interaction.values[0];
        setSpinsPassesConfig({ categoria_id: catId });
        return interaction.update(gerarPainelSpinsConfig('✅ **Categoria de Spins & Passes atualizada para <#' + catId + '>!**'));
    }
    if (cid === 'cfg_sel_spins_logs') {
        const logId = interaction.values[0];
        setSpinsPassesConfig({ canal_logs_id: logId });
        return interaction.update(gerarPainelSpinsConfig('✅ **Canal de Logs de Spins & Passes atualizado para <#' + logId + '>!**'));
    }
    if (cid === 'cfg_sel_spins_role') {
        const roleId = interaction.values[0];
        setSpinsPassesConfig({ cargo_staff_id: roleId });
        return interaction.update(gerarPainelSpinsConfig('✅ **Cargo da Staff de Spins & Passes atualizado para <@&' + roleId + '>!**'));
    }
    if (cid === 'cfg_btn_spins_rem_mode') {
        return interaction.update(gerarPainelSpinsRemover());
    }
    if (cid === 'cfg_btn_spins_price_mode') {
        return interaction.update(gerarPainelSpinsPreco());
    }
    if (cid === 'cfg_btn_spins_add') {
        const modal = new ModalBuilder()
            .setCustomId('modal_spins_add_item')
            .setTitle('Adicionar Pacote de Spin ou Passe');

        const inputNome = new TextInputBuilder()
            .setCustomId('input_spins_nome')
            .setLabel('Nome do Pacote ou Passe:')
            .setPlaceholder('Ex: 2.000 Spins ou Passe VIP')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const inputTipo = new TextInputBuilder()
            .setCustomId('input_spins_tipo')
            .setLabel('Tipo ("spin" ou "passe"):')
            .setPlaceholder('spin ou passe')
            .setValue('spin')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const inputPreco = new TextInputBuilder()
            .setCustomId('input_spins_preco')
            .setLabel('Preço em R$ (ou A Combinar):')
            .setPlaceholder('Ex: 25.00 ou A Combinar')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const inputEmoji = new TextInputBuilder()
            .setCustomId('input_spins_emoji')
            .setLabel('Emoji (opcional):')
            .setPlaceholder('Ex: 🌀 ou 🎟️')
            .setStyle(TextInputStyle.Short)
            .setRequired(false);

        const inputDesc = new TextInputBuilder()
            .setCustomId('input_spins_desc')
            .setLabel('Descrição curta (opcional):')
            .setPlaceholder('Ex: Pacote especial com entrega imediata')
            .setStyle(TextInputStyle.Short)
            .setRequired(false);

        modal.addComponents(
            new ActionRowBuilder().addComponents(inputNome),
            new ActionRowBuilder().addComponents(inputTipo),
            new ActionRowBuilder().addComponents(inputPreco),
            new ActionRowBuilder().addComponents(inputEmoji),
            new ActionRowBuilder().addComponents(inputDesc)
        );
        return interaction.showModal(modal);
    }
    if (cid === 'cfg_sel_spins_delete_item') {
        const prodId = interaction.values[0];
        const removido = await removerProdutoSpins(interaction.guild, prodId);
        return interaction.update(gerarPainelSpinsConfig(removido ? '🗑️ **Item "' + removido.nome + '" removido com sucesso do painel!**' : '❌ Item não encontrado.'));
    }
    if (cid === 'cfg_sel_spins_change_price') {
        const prodId = interaction.values[0];
        const spnCfg = getSpinsPassesConfig();
        const prod = (spnCfg.produtos || []).find(p => p.id === prodId);
        if (!prod) return interaction.reply({ content: '❌ Produto não encontrado.', flags: [MessageFlags.Ephemeral] });

        const modal = new ModalBuilder()
            .setCustomId('modal_spins_price_' + prod.id)
            .setTitle(('Alterar Preço • ' + prod.nome).substring(0, 45));

        const input = new TextInputBuilder()
            .setCustomId('input_novo_preco')
            .setLabel('Novo Preço (ex: 20.00 ou A Combinar):')
            .setValue(String(prod.preco))
            .setPlaceholder('Ex: 25.00 ou 18,50 ou A Combinar')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        modal.addComponents(new ActionRowBuilder().addComponents(input));
        return interaction.showModal(modal);
    }

    // D. SELECTS DE CANAL & CARGO (TOKENS)
    if (cid === 'cfg_sel_tok_cat') {
        const catId = interaction.values[0];
        setTokensConfig({ categoria_id: catId });
        return interaction.update(gerarPainelTokensConfig('✅ **Categoria de Tokens atualizada para <#' + catId + '>!**'));
    }
    if (cid === 'cfg_sel_tok_logs') {
        const logId = interaction.values[0];
        setTokensConfig({ canal_logs_id: logId });
        return interaction.update(gerarPainelTokensConfig('✅ **Canal de Logs de Tokens atualizado para <#' + logId + '>!**'));
    }
    if (cid === 'cfg_sel_tok_role') {
        const roleId = interaction.values[0];
        setTokensConfig({ cargo_staff_id: roleId });
        return interaction.update(gerarPainelTokensConfig('✅ **Cargo da Staff de Tokens atualizado para <@&' + roleId + '>!**'));
    }

    // E. SELECTS DE CANAL & CARGO (ITENS)
    if (cid === 'cfg_sel_itn_cat') {
        const catId = interaction.values[0];
        setItensConfig({ categoria_id: catId });
        return interaction.update(gerarPainelItensConfig('✅ **Categoria de Itens atualizada para <#' + catId + '>!**'));
    }
    if (cid === 'cfg_sel_itn_logs') {
        const logId = interaction.values[0];
        setItensConfig({ canal_logs_id: logId });
        return interaction.update(gerarPainelItensConfig('✅ **Canal de Logs de Itens atualizado para <#' + logId + '>!**'));
    }
    if (cid === 'cfg_sel_itn_role') {
        const roleId = interaction.values[0];
        setItensConfig({ cargo_staff_id: roleId });
        return interaction.update(gerarPainelItensConfig('✅ **Cargo da Staff de Itens atualizado para <@&' + roleId + '>!**'));
    }

    // F. DESPACHO DE PAINÉIS
    if (cid === 'cfg_send_panel_suporte') {
        const payload = gerarPainelSuportePayload();
        const msg = await interaction.channel.send(payload);
        setSuporteConfig({ canal_painel_id: interaction.channel.id, mensagem_painel_id: msg.id });
        return interaction.reply({
            content: '✅ **Painel de Suporte** enviado com sucesso neste canal!',
            flags: [MessageFlags.Ephemeral]
        });
    }

    if (cid === 'cfg_send_panel_tokens') {
        const payload = gerarPainelTokensPayload();
        const msg = await interaction.channel.send(payload);
        setTokensConfig({ canal_painel_id: interaction.channel.id, mensagem_painel_id: msg.id });
        return interaction.reply({
            content: '✅ **Painel de Tokens** enviado com sucesso neste canal!',
            flags: [MessageFlags.Ephemeral]
        });
    }

    
    if (cid === 'cfg_send_panel_spins') {
        const payload = gerarPainelSpinsPassesPayload();
        const msg = await interaction.channel.send(payload);
        setSpinsPassesConfig({ canal_painel_id: interaction.channel.id, mensagem_painel_id: msg.id });
        return interaction.reply({
            content: '🌀 **Painel de Spins & Passes** enviado com sucesso neste canal!',
            flags: [MessageFlags.Ephemeral]
        });
    }

    if (cid === 'cfg_send_panel_itens') {
        const payload = gerarPainelItensPayload(interaction.guild);
        const msg = await interaction.channel.send(payload);
        setItensConfig({ canal_painel_id: interaction.channel.id, mensagem_painel_id: msg.id });
        return interaction.reply({
            content: '⚔️ **Arsenal de Itens Blade Ball (Kensai Store)** enviado com sucesso neste canal!',
            flags: [MessageFlags.Ephemeral]
        });
    }

    if (cid === 'cfg_btn_guia_itens') {
        const embedGuia = criarEmbedPadrao('📦 Guia de Comandos do Arsenal • Kensai Store')
            .setDescription(
                'Confira abaixo os comandos disponíveis para a Staff gerenciar o catálogo e o estoque:\n\n' +
                '• `/item adicionar` ➔ Adiciona itens com auto-detecção em +2.100 espadas, emotes e explosões!\n' +
                '• `/item estoque` ➔ Atualiza a quantidade disponível de qualquer item.\n' +
                '• `/item preco` ➔ Altera o valor de venda (R$) de um item.\n' +
                '• `/item remover` ➔ Remove um item do catálogo.\n' +
                '• `/item listar` ➔ Exibe todos os itens cadastrados por categoria e estoque.\n\n' +
                '💡 *Para publicar o painel para os membros comprarem, utilize o botão **Enviar Arsenal de Itens Aqui**.*'
            )
            .setFooter({ text: 'Kensai Store • Painel de Gestão Staff' });

        return interaction.reply({
            embeds: [embedGuia],
            flags: [MessageFlags.Ephemeral]
        });
    }

    // G. MODAL SUBMIT (TOKENS)
    if (cid === 'modal_cfg_tokens') {
        const rawPreco = interaction.fields.getTextInputValue('cfg_input_preco_1k');
        let rawPix = '';
        try {
            rawPix = interaction.fields.getTextInputValue('cfg_input_chave_pix');
        } catch (e) {}

        let precoLimpo = NaN;
        if (rawPreco) {
            const limpo = rawPreco.replace(/[^\d,\.]/g, '').trim();
            if (limpo.includes(',') && limpo.includes('.')) {
                if (limpo.indexOf('.') < limpo.indexOf(',')) {
                    precoLimpo = parseFloat(limpo.replace(/\./g, '').replace(',', '.'));
                } else {
                    precoLimpo = parseFloat(limpo.replace(/,/g, ''));
                }
            } else if (limpo.includes(',')) {
                precoLimpo = parseFloat(limpo.replace(',', '.'));
            } else {
                precoLimpo = parseFloat(limpo);
            }
        }

        const updates = {};
        if (!isNaN(precoLimpo) && precoLimpo > 0) {
            updates.preco_por_1k = precoLimpo;
        }
        if (rawPix && rawPix.trim().length > 0) {
            updates.chave_pix = rawPix.trim();
        } else if (!updates.chave_pix) {
            updates.chave_pix = 'kensai.store.oficial@gmail.com';
        }

        const updated = setTokensConfig(updates);

        // Se o painel público de tokens já foi despachado no Discord, atualiza a mensagem em tempo real
        if (updated.canal_painel_id && updated.mensagem_painel_id && interaction.guild) {
            try {
                const painelChan = interaction.guild.channels.cache.get(updated.canal_painel_id) || await interaction.guild.channels.fetch(updated.canal_painel_id).catch(() => null);
                if (painelChan && painelChan.isTextBased()) {
                    const painelMsg = await painelChan.messages.fetch(updated.mensagem_painel_id).catch(() => null);
                    if (painelMsg) {
                        const payload = gerarPainelTokensPayload();
                        await painelMsg.edit(payload).catch(() => {});
                    }
                }
            } catch (err) {
                console.error('[Config] Erro ao sincronizar mensagem do painel de tokens:', err.message);
            }
        }

        const precoFinalStr = Number(updated.preco_por_1k !== undefined ? updated.preco_por_1k : 18).toFixed(2).replace('.', ',');
        return interaction.reply({
            content: '✅ **Cotação de Tokens e Chave Pix gravadas com sucesso!**\n\n' +
                '• **Cotação por 1.000 Tokens:** `R$ ' + precoFinalStr + '`\n' +
                '• **Chave Pix Oficial:** `' + (updated.chave_pix || 'kensai.store.oficial@gmail.com') + '`\n\n' +
                '✨ *A cotação foi salva no sistema. Qualquer novo ticket ou painel aberto já utilizará `R$ ' + precoFinalStr + '`!*',
            flags: [MessageFlags.Ephemeral]
        });
    }

    // H.1 MODAL SUBMIT (ADICIONAR ITEM SPINS & PASSES)
    if (cid === 'modal_spins_add_item') {
        const nome = interaction.fields.getTextInputValue('input_spins_nome');
        const tipo = interaction.fields.getTextInputValue('input_spins_tipo');
        const preco = interaction.fields.getTextInputValue('input_spins_preco');
        let emoji = '';
        let descricao = '';
        try { emoji = interaction.fields.getTextInputValue('input_spins_emoji'); } catch(e){}
        try { descricao = interaction.fields.getTextInputValue('input_spins_desc'); } catch(e){}

        const novo = await adicionarProdutoSpins(interaction.guild, { nome, tipo, preco, emoji, descricao });
        const precoFormatado = formatarPrecoProduto(novo.preco);
        return interaction.reply({
            content: '✅ **' + novo.nome + '** adicionado com sucesso ao painel de Spins & Passes!\n\n' +
                     '• **Tipo:** `' + (novo.tipo === 'spin' ? '🌀 Spin' : '🎟️ Passe') + '`\n' +
                     '• **Preço:** `' + precoFormatado + '`\n\n' +
                     '🔄 *O painel público e dropdown foram atualizados automaticamente.*',
            flags: [MessageFlags.Ephemeral]
        });
    }

    // H.2 MODAL SUBMIT (SPINS & PASSES PRICE)
    if (cid.startsWith('modal_spins_price_')) {
        const prodId = cid.replace('modal_spins_price_', '');
        const rawPreco = interaction.fields.getTextInputValue('input_novo_preco').trim();
        const spnCfg = getSpinsPassesConfig();
        const produtos = spnCfg.produtos || [];
        const prod = produtos.find(p => p.id === prodId);
        if (!prod) {
            return interaction.reply({ content: '❌ Produto não encontrado.', flags: [MessageFlags.Ephemeral] });
        }

        let novoPreco = rawPreco;
        const num = parseFloat(rawPreco.replace(/[^\d,\.]/g, '').replace(',', '.'));
        if (!isNaN(num) && num >= 0 && !/[a-zA-Z]/.test(rawPreco)) {
            novoPreco = num.toFixed(2);
        }

        prod.preco = novoPreco;
        const updated = setSpinsPassesConfig({ produtos });

        // Sincroniza em tempo real com a mensagem do painel público se já tiver sido enviada
        if (updated.canal_painel_id && updated.mensagem_painel_id && interaction.guild) {
            try {
                const chan = interaction.guild.channels.cache.get(updated.canal_painel_id) || await interaction.guild.channels.fetch(updated.canal_painel_id).catch(() => null);
                if (chan && chan.isTextBased()) {
                    const msg = await chan.messages.fetch(updated.mensagem_painel_id).catch(() => null);
                    if (msg) {
                        const payload = gerarPainelSpinsPassesPayload();
                        await msg.edit(payload).catch(() => {});
                    }
                }
            } catch (err) {
                console.error('[Config] Erro ao sincronizar mensagem de spins/passes:', err.message);
            }
        }

        const precoFormatado = typeof novoPreco === 'number' ? 'R$ ' + novoPreco.toFixed(2).replace('.', ',') : (parseFloat(novoPreco) ? 'R$ ' + parseFloat(novoPreco).toFixed(2).replace('.', ',') : String(novoPreco));
        return interaction.reply({
            content: '✅ **Preço de ' + prod.nome + ' atualizado com sucesso para `' + precoFormatado + '`!**\n\n' +
                     '🔄 *O painel público e novos pedidos já refletem este novo valor.*',
            flags: [MessageFlags.Ephemeral]
        });
    }
}

module.exports = {
    gerarPainelPrincipal,
    gerarPainelSuporteConfig,
    gerarPainelTokensConfig,
    gerarPainelItensConfig,
    gerarPainelDespachoPaineis,
    gerarPainelSpinsConfig,
    gerarPainelSpinsRemover,
    gerarPainelSpinsPreco,
    gerarPainelSpinsOrdem,
    gerarModalConfigTokens,
    handleConfigInteraction
};
