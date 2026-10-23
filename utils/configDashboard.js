const { 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    ChannelSelectMenuBuilder, 
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
    getItensConfig, setItensConfig 
} = require('./ticketConfigs');
const { 
    gerarPainelSuportePayload, 
    gerarPainelTokensPayload, 
    gerarPainelItensPayload 
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
                value: '• **Preço por 1.000:** `R$ ' + Number(tok.preco_por_1k || 18.5).toFixed(2).replace('.', ',') + '`\n' +
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
            }
        )
        .setFooter({ text: 'Clique nos botões abaixo para configurar ou enviar os painéis' });

    const rowNav = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('cfg_nav_suporte')
            .setLabel('Configurar Suporte')
            .setEmoji('🎫')
            .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
            .setCustomId('cfg_nav_tokens')
            .setLabel('Configurar Tokens')
            .setEmoji('💰')
            .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
            .setCustomId('cfg_nav_itens')
            .setLabel('Configurar Itens')
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
 * 5. Painel de Despacho Rápido de Painéis
 */
function gerarPainelDespachoPaineis(statusNotice) {
    const embed = criarEmbedPadrao('📢 Despacho de Painéis Oficiais • Kensai Store')
        .setDescription(
            (statusNotice ? statusNotice + '\n\n' : '') +
            'Clique no botão abaixo para fixar o painel oficial desejado diretamente **neste canal**:\n\n' +
            '• **🎫 Painel de Suporte:** Botão para abertura de dúvidas e denúncias.\n' +
            '• **💰 Painel de Tokens:** Dropdown com pacotes rápidos + botão de quantia customizada.\n' +
            '• **⚔️ Catálogo de Itens:** Dropdown de compra direta de produtos da loja.'
        )
        .setFooter({ text: 'O painel será enviado como uma nova mensagem pública no canal' });

    const rowPaineis = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('cfg_send_panel_suporte')
            .setLabel('Enviar Suporte')
            .setEmoji('🎫')
            .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
            .setCustomId('cfg_send_panel_tokens')
            .setLabel('Enviar Tokens')
            .setEmoji('💰')
            .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
            .setCustomId('cfg_send_panel_itens')
            .setLabel('Enviar Catálogo Itens')
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

    const inputPreco = new TextInputBuilder()
        .setCustomId('cfg_input_preco_1k')
        .setLabel('Preço por 1.000 tokens (R$):')
        .setValue(String(tok.preco_por_1k || 18.5))
        .setPlaceholder('Ex: 18.50')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

    const inputPix = new TextInputBuilder()
        .setCustomId('cfg_input_chave_pix')
        .setLabel('Chave Pix da loja:')
        .setValue(String(tok.chave_pix || ''))
        .setPlaceholder('Ex: pix@kensaistore.com ou CPF/Celular')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

    modal.addComponents(
        new ActionRowBuilder().addComponents(inputPreco),
        new ActionRowBuilder().addComponents(inputPix)
    );

    return modal;
}

/**
 * Handler central de todas as interações do painel de configuração
 */
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
        const rawPix = interaction.fields.getTextInputValue('cfg_input_chave_pix');
        const precoLimpo = parseFloat(rawPreco.replace(/[^0-9,\.]/g, '').replace(',', '.'));

        const updates = {};
        if (!isNaN(precoLimpo) && precoLimpo > 0) updates.preco_por_1k = precoLimpo;
        if (rawPix && rawPix.trim().length > 0) updates.chave_pix = rawPix.trim();

        const updated = setTokensConfig(updates);
        return interaction.reply({
            content: '✅ **Preço por 1.000 Tokens e Chave Pix atualizados com sucesso!**\n\n' +
                '• **Preço por 1k:** `R$ ' + Number(updated.preco_por_1k || 18.5).toFixed(2).replace('.', ',') + '`\n' +
                '• **Chave Pix:** `' + (updated.chave_pix || 'Não configurada') + '`',
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
    gerarModalConfigTokens,
    handleConfigInteraction
};
