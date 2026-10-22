const { 
    PermissionsBitField, 
    ChannelType, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    AttachmentBuilder, 
    MessageFlags 
} = require('discord.js');
const { criarEmbedPadrao, criarEmbedSucesso, criarEmbedErro } = require('./embeds');
const { readData, writeData } = require('./db');
const { getSuporteConfig, getTokensConfig, getItensConfig } = require('./ticketConfigs');
const { checkPermission } = require('./permissions');

const TOKEN_EMOJI_STR = '<:token:1562671579257770147>';

/**
 * Gera um protocolo único no formato KS-XXXXXX
 */
function gerarProtocolo() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return 'KS-' + code;
}

/**
 * Retorna o config adequado para o tipo de ticket
 */
function getConfigPorTipo(tipo) {
    if (tipo === 'tokens') return getTokensConfig();
    if (tipo === 'itens') return getItensConfig();
    return getSuporteConfig();
}

/**
 * Verifica se um membro pertence à Staff do ticket
 */
function isMemberStaff(member, sysConfig) {
    if (!member) return false;
    if (checkPermission(member, PermissionsBitField.Flags.Administrator)) return true;
    if (sysConfig && sysConfig.cargo_staff_id && member.roles?.cache?.has(sysConfig.cargo_staff_id)) return true;
    return false;
}

/**
 * Abre um novo canal de ticket para o usuário
 */
async function abrirTicket(interaction, tipo, detalhes) {
    const guild = interaction.guild;
    const user = interaction.user;
    const sysConfig = getConfigPorTipo(tipo);

    const ativos = readData('tickets_ativos', {});
    
    // Evita tickets duplicados do mesmo tipo abertos pelo mesmo membro
    const jaAberto = Object.values(ativos).find(function(t) {
        return t.userId === user.id && t.tipo === tipo && !t.fechado;
    });

    if (jaAberto) {
        const canalExistente = guild.channels.cache.get(jaAberto.channelId);
        if (canalExistente) {
            return interaction.reply({
                content: '⚠️ Você já possui um ticket aberto em <#' + jaAberto.channelId + '>!',
                flags: [MessageFlags.Ephemeral]
            });
        }
    }

    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

    const protocolo = gerarProtocolo();
    const prefixCanal = tipo === 'tokens' ? 'token-' : (tipo === 'itens' ? 'item-' : (tipo === 'compra' ? 'compra-' : (tipo === 'denuncia' ? 'denuncia-' : 'suporte-')));
    const nomeCanal = prefixCanal + user.username.toLowerCase().replace(/[^a-z0-9]/g, '');

    // Permissões iniciais do canal
    const permissionOverwrites = [
        {
            id: guild.roles.everyone.id,
            deny: [PermissionsBitField.Flags.ViewChannel]
        },
        {
            id: user.id,
            allow: [
                PermissionsBitField.Flags.ViewChannel,
                PermissionsBitField.Flags.SendMessages,
                PermissionsBitField.Flags.AttachFiles,
                PermissionsBitField.Flags.ReadMessageHistory
            ]
        },
        {
            id: guild.members.me.id,
            allow: [
                PermissionsBitField.Flags.ViewChannel,
                PermissionsBitField.Flags.SendMessages,
                PermissionsBitField.Flags.ManageChannels,
                PermissionsBitField.Flags.EmbedLinks,
                PermissionsBitField.Flags.AttachFiles
            ]
        }
    ];

    if (sysConfig.cargo_staff_id) {
        permissionOverwrites.push({
            id: sysConfig.cargo_staff_id,
            allow: [
                PermissionsBitField.Flags.ViewChannel,
                PermissionsBitField.Flags.SendMessages,
                PermissionsBitField.Flags.AttachFiles,
                PermissionsBitField.Flags.ReadMessageHistory
            ]
        });
    }

    // Cria o canal na categoria configurada
    let canal;
    try {
        canal = await guild.channels.create({
            name: nomeCanal,
            type: ChannelType.GuildText,
            parent: sysConfig.categoria_id || null,
            permissionOverwrites: permissionOverwrites,
            topic: '📌 Protocolo: ' + protocolo + ' | Tipo: ' + tipo.toUpperCase() + ' | Cliente: ' + user.tag
        });
    } catch (error) {
        console.error('Erro ao criar canal do ticket:', error);
        return interaction.editReply({
            content: '❌ Ocorreu um erro ao criar a sala do ticket. Verifique as permissões do bot e categorias.'
        });
    }

    // Armazena no banco de dados com estado de compra pendente
    ativos[protocolo] = {
        protocolo: protocolo,
        tipo: tipo,
        userId: user.id,
        userTag: user.tag,
        channelId: canal.id,
        guildId: guild.id,
        abertoEm: Date.now(),
        detalhes: detalhes || null,
        statusCompra: 'AGUARDANDO',
        staffId: null,
        fechado: false
    };
    writeData('tickets_ativos', ativos);

    // Constrói embed de boas-vindas do ticket
    let titulo = '🎫 Atendimento de Suporte';
    let desc = 'Olá ' + user.toString() + ', seja bem-vindo ao seu ticket de suporte da **Kensai Store**!\n\n' +
        'Descreva detalhadamente como podemos te ajudar. Um membro de nossa equipe atenderá você em breve.';

    const embedTicket = criarEmbedPadrao(titulo);

    if (tipo === 'tokens') {
        titulo = TOKEN_EMOJI_STR + ' Pedido de Tokens • Kensai Store';
        const qtdTokens = Number(detalhes?.quantidade || 1000);
        const precoUnitario = Number(sysConfig.preco_por_1k || 18.50);
        const valorCalculado = (qtdTokens / 1000) * precoUnitario;
        const valorFormatado = 'R$ ' + valorCalculado.toFixed(2).replace('.', ',');
        const preco1kFormatado = 'R$ ' + precoUnitario.toFixed(2).replace('.', ',');
        const chavePix = sysConfig.chave_pix || 'Chave Pix a consultar com a staff';

        desc = '> Olá ' + user.toString() + ', seu pedido de **Tokens** foi iniciado com sucesso!\n\n' +
            '📌 **COMO FINALIZAR SUA COMPRA:**\n' +
            '1. Faça a transferência Pix no valor exato de **' + valorFormatado + '** para a chave abaixo;\n' +
            '2. Envie o **comprovante de pagamento** neste chat;\n' +
            '3. Envie o seu **Nick / Conta** do jogo onde deseja receber os tokens;\n' +
            '4. A equipe da Staff verificará e clicará no botão de aprovação logo abaixo!';

        embedTicket
            .setTitle(titulo)
            .setDescription(desc)
            .addFields(
                { name: TOKEN_EMOJI_STR + ' Quantidade', value: '`' + qtdTokens.toLocaleString('pt-BR') + ' Tokens`', inline: true },
                { name: '💵 Valor a Pagar', value: '`' + valorFormatado + '`', inline: true },
                { name: '📊 Cotação (1k)', value: '`' + preco1kFormatado + '`', inline: true },
                { name: '🔑 Chave Pix da Loja', value: '`' + chavePix + '`', inline: false },
                { name: '📦 Status do Pedido', value: '🟡 **Aguardando Pagamento & Comprovante**', inline: false },
                { name: '📋 Protocolo', value: '`' + protocolo + '`', inline: true },
                { name: '👤 Cliente', value: user.toString(), inline: true },
                { name: '⏰ Aberto em', value: '<t:' + Math.floor(Date.now() / 1000) + ':R>', inline: true }
            );
    } else if (tipo === 'itens') {
        titulo = '⚔️ Pedido de Item • Kensai Store';
        const itemNome = detalhes?.nome || 'Item do Catálogo';
        const itemPreco = detalhes?.preco || 'A Combinar';
        const itemDesc = detalhes?.descricao || '';

        desc = '> Olá ' + user.toString() + ', você solicitou a compra de um item do nosso catálogo:\n\n' +
            '📌 **PRÓXIMOS PASSOS:**\n' +
            '1. Combine os detalhes de entrega e forma de pagamento com a Staff logo abaixo;\n' +
            '2. Envie o comprovante de pagamento no chat;\n' +
            '3. O atendente fará a entrega no jogo e confirmará no botão de entrega!';

        embedTicket
            .setTitle(titulo)
            .setDescription(desc)
            .addFields(
                { name: '⚔️ Item Selecionado', value: '`' + itemNome + '`', inline: true },
                { name: '💵 Preço', value: '`' + itemPreco + '`', inline: true },
                { name: '📦 Status do Pedido', value: '🟡 **Aguardando Atendimento**', inline: true },
                { name: '📝 Detalhes', value: itemDesc || 'Item oficial do catálogo Kensai Store.', inline: false },
                { name: '📋 Protocolo', value: '`' + protocolo + '`', inline: true },
                { name: '👤 Cliente', value: user.toString(), inline: true },
                { name: '⏰ Aberto em', value: '<t:' + Math.floor(Date.now() / 1000) + ':R>', inline: true }
            );
    } else if (tipo === 'denuncia') {
        titulo = '🚨 Central de Denúncias & Ouvidoria • Kensai Store';
        desc = '> Olá ' + user.toString() + ', sua denúncia foi protocolada com prioridade máxima.\n' +
            '> Nossa administração investiga rigorosamente qualquer tentativa de golpe (scam), invasão ou má conduta.\n\n' +
            '📋 **GUIA DE INSTRUÇÕES — ENVIE NO CHAT:**\n' +
            '• **Nick do acusado:** `(Roblox / Discord / ID)`\n' +
            '• **Descrição detalhada:** `(Explique exatamente o que aconteceu)`\n' +
            '• **Provas materiais:** `(Prints, gravações em vídeo ou comprovantes) — [Obrigatório]`\n\n' +
            '⏳ *Aguarde um momento. Um administrador revisará o material e assumirá este chamado.*';

        embedTicket
            .setTitle(titulo)
            .setDescription(desc)
            .addFields(
                { name: '📋 Protocolo', value: '`' + protocolo + '`', inline: true },
                { name: '👤 Denunciante', value: user.toString(), inline: true },
                { name: '🚨 Prioridade', value: '🔴 **Alta**', inline: true }
            );
    } else if (tipo === 'compra') {
        titulo = '🛒 Setor Comercial & Pedidos • Kensai Store';
        desc = '> Olá ' + user.toString() + ', seja muito bem-vindo ao setor comercial da **Kensai Store**!\n\n' +
            '📌 **COMO PODEMOS TE AJUDAR:**\n' +
            '• Qual produto, entrega ou encomenda personalizada você deseja?\n' +
            '• Se já realizou o pagamento ou tem entrega pendente, envie o comprovante Pix aqui;\n' +
            '• Informe o seu Nick no jogo / Roblox para agilizarmos o atendimento.\n\n' +
            '⏳ *Um atendente da nossa equipe comercial responderá em breve.*';

        embedTicket
            .setTitle(titulo)
            .setDescription(desc)
            .addFields(
                { name: '📋 Protocolo', value: '`' + protocolo + '`', inline: true },
                { name: '👤 Cliente', value: user.toString(), inline: true },
                { name: '⏰ Aberto em', value: '<t:' + Math.floor(Date.now() / 1000) + ':R>', inline: true }
            );
    } else {
        titulo = '🔎 Suporte Geral & Comunidade • Kensai Store';
        desc = '> Olá ' + user.toString() + ', seja bem-vindo ao **Suporte Geral** da **Kensai Store**!\n\n' +
            '📌 **COMO PODEMOS TE AJUDAR:**\n' +
            'Descreva detalhadamente a sua dúvida sobre regras, cargos VIP, benefícios, parcerias ou sugestões para a comunidade.\n\n' +
            '⏳ *Nossa equipe atenderá você em instantes.*';

        embedTicket
            .setTitle(titulo)
            .setDescription(desc)
            .addFields(
                { name: '📋 Protocolo', value: '`' + protocolo + '`', inline: true },
                { name: '👤 Cliente', value: user.toString(), inline: true },
                { name: '⏰ Aberto em', value: '<t:' + Math.floor(Date.now() / 1000) + ':R>', inline: true }
            );
    }

    embedTicket.setFooter({ text: 'Kensai Store • Protocolo ' + protocolo });

    // Botões de Ação Geral
    const rowAcoes = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('ticket_fechar_' + protocolo)
            .setLabel('Fechar Ticket')
            .setEmoji('🔒')
            .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
            .setCustomId('ticket_assumir_' + protocolo)
            .setLabel('Assumir Atendimento')
            .setEmoji('✋')
            .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
            .setCustomId('ticket_chamar_' + protocolo)
            .setLabel('Chamar Cliente')
            .setEmoji('🔔')
            .setStyle(ButtonStyle.Secondary)
    );

    const components = [rowAcoes];

    // Se for ticket de compra (tokens ou itens), adiciona linha de validação comercial da staff
    if (tipo === 'tokens') {
        const rowVenda = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('token_aprovar_' + protocolo)
                .setLabel('Aprovar Pagamento & Entregar')
                .setEmoji('✅')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId('token_recusar_' + protocolo)
                .setLabel('Recusar Pedido')
                .setEmoji('❌')
                .setStyle(ButtonStyle.Danger)
        );
        components.push(rowVenda);
    } else if (tipo === 'itens') {
        const rowVenda = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('item_aprovar_' + protocolo)
                .setLabel('Confirmar Entrega do Item')
                .setEmoji('✅')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId('item_recusar_' + protocolo)
                .setLabel('Cancelar Pedido')
                .setEmoji('❌')
                .setStyle(ButtonStyle.Danger)
        );
        components.push(rowVenda);
    }

    const staffMention = sysConfig.cargo_staff_id ? '<@&' + sysConfig.cargo_staff_id + '>' : '';
    await canal.send({
        content: user.toString() + ' ' + staffMention,
        embeds: [embedTicket],
        components: components
    });

    await interaction.editReply({
        content: '✅ Seu ticket foi aberto com sucesso em ' + canal.toString() + '!'
    });
}

/**
 * Staff aprova o pagamento e confirma a entrega dos tokens
 */
async function aprovarCompraToken(interaction, protocolo) {
    const ativos = readData('tickets_ativos', {});
    const ticket = ativos[protocolo];
    const sysConfig = getConfigPorTipo('tokens');

    if (!isMemberStaff(interaction.member, sysConfig)) {
        return interaction.reply({
            content: '❌ Apenas membros da equipe da Staff podem aprovar pedidos!',
            flags: [MessageFlags.Ephemeral]
        });
    }

    if (!ticket) {
        return interaction.reply({ content: '❌ Ticket não encontrado nos registros.', flags: [MessageFlags.Ephemeral] });
    }

    if (ticket.statusCompra === 'APROVADO') {
        return interaction.reply({ content: '⚠️ Este pedido já foi aprovado anteriormente!', flags: [MessageFlags.Ephemeral] });
    }

    ticket.statusCompra = 'APROVADO';
    ticket.aprovadoPor = interaction.user.id;
    ticket.aprovadoEm = Date.now();
    ativos[protocolo] = ticket;
    writeData('tickets_ativos', ativos);

    const qtdNum = Number(ticket.detalhes?.quantidade || 1000);
    const precoUnitario = Number(sysConfig.preco_por_1k || 18.50);
    const valorTotal = (qtdNum / 1000) * precoUnitario;
    const valorStr = 'R$ ' + valorTotal.toFixed(2).replace('.', ',');

    const embedAprovado = criarEmbedPadrao('🎉 Compra Aprovada & Tokens Entregues!')
        .setDescription(
            'O pagamento de <@' + ticket.userId + '> foi verificado com sucesso e a entrega foi autorizada!\n\n' +
            '• ' + TOKEN_EMOJI_STR + ' **Tokens Entregues:** `' + qtdNum.toLocaleString('pt-BR') + ' Tokens`\n' +
            '• 💵 **Valor Confirmado:** `' + valorStr + '`\n' +
            '• 🛡️ **Atendente Responsável:** ' + interaction.user.toString() + '\n' +
            '• ⏰ **Data da Confirmação:** <t:' + Math.floor(Date.now() / 1000) + ':f>\n\n' +
            '✨ *Agradecemos pela preferência na **Kensai Store**! Use `/avaliar` ou `/vouch` para deixar seu feedback.*'
        )
        .setFooter({ text: 'Kensai Store • Pedido ' + protocolo });

    await interaction.channel.send({
        content: '🎉 <@' + ticket.userId + '>, seu pagamento foi **aprovado** e os tokens foram entregues!',
        embeds: [embedAprovado]
    });

    return interaction.reply({
        content: '✅ Você aprovou o pedido **' + protocolo + '** com sucesso!',
        flags: [MessageFlags.Ephemeral]
    });
}

/**
 * Staff recusa ou cancela o pedido de tokens
 */
async function recusarCompraToken(interaction, protocolo) {
    const ativos = readData('tickets_ativos', {});
    const ticket = ativos[protocolo];
    const sysConfig = getConfigPorTipo('tokens');

    if (!isMemberStaff(interaction.member, sysConfig)) {
        return interaction.reply({
            content: '❌ Apenas membros da equipe da Staff podem recusar pedidos!',
            flags: [MessageFlags.Ephemeral]
        });
    }

    if (!ticket) {
        return interaction.reply({ content: '❌ Ticket não encontrado nos registros.', flags: [MessageFlags.Ephemeral] });
    }

    ticket.statusCompra = 'RECUSADO';
    ticket.recusadoPor = interaction.user.id;
    ticket.recusadoEm = Date.now();
    ativos[protocolo] = ticket;
    writeData('tickets_ativos', ativos);

    const embedRecusado = criarEmbedErro('❌ Pedido Recusado / Não Aprovado',
        'O pedido de tokens **' + protocolo + '** foi recusado por ' + interaction.user.toString() + '.\n\n' +
        'Motivos comuns: Comprovante de pagamento não enviado, Pix não compensado ou dados divergentes.\n' +
        'Caso tenha dúvidas, consulte a equipe de atendimento neste chat.'
    );

    await interaction.channel.send({
        content: '⚠️ <@' + ticket.userId + '>, seu pedido de tokens foi marcado como **recusado**.',
        embeds: [embedRecusado]
    });

    return interaction.reply({
        content: '⚠️ Pedido **' + protocolo + '** marcado como recusado.',
        flags: [MessageFlags.Ephemeral]
    });
}

/**
 * Staff confirma entrega de item do catálogo
 */
async function aprovarEntregaItem(interaction, protocolo) {
    const ativos = readData('tickets_ativos', {});
    const ticket = ativos[protocolo];
    const sysConfig = getConfigPorTipo('itens');

    if (!isMemberStaff(interaction.member, sysConfig)) {
        return interaction.reply({ content: '❌ Apenas membros da Staff podem confirmar a entrega.', flags: [MessageFlags.Ephemeral] });
    }

    if (!ticket) return interaction.reply({ content: '❌ Ticket não encontrado.', flags: [MessageFlags.Ephemeral] });

    ticket.statusCompra = 'APROVADO';
    ticket.aprovadoPor = interaction.user.id;
    ticket.aprovadoEm = Date.now();
    ativos[protocolo] = ticket;
    writeData('tickets_ativos', ativos);

    const embedAprovado = criarEmbedPadrao('🎉 Entrega Concluída com Sucesso!')
        .setDescription(
            'A entrega do item para <@' + ticket.userId + '> foi finalizada pela staff!\n\n' +
            '• ⚔️ **Item Entregue:** `' + (ticket.detalhes?.nome || 'Item do Catálogo') + '`\n' +
            '• 💵 **Preço:** `' + (ticket.detalhes?.preco || 'A Combinar') + '`\n' +
            '• 🛡️ **Entregue por:** ' + interaction.user.toString() + '\n\n' +
            '✨ *Obrigado por comprar na Kensai Store!*'
        );

    await interaction.channel.send({
        content: '🎉 <@' + ticket.userId + '>, seu item foi entregue!',
        embeds: [embedAprovado]
    });

    return interaction.reply({ content: '✅ Entrega do item registrada com sucesso!', flags: [MessageFlags.Ephemeral] });
}

/**
 * Fecha o ticket, gera transcript e envia nos logs configurados
 */
async function fecharTicket(interaction, protocolo) {
    const guild = interaction.guild;
    const channel = interaction.channel;
    const ativos = readData('tickets_ativos', {});
    const ticket = ativos[protocolo];

    await interaction.reply({
        content: '⏳ Encerrando o ticket e arquivando transcript em 5 segundos...'
    });

    const sysConfig = getConfigPorTipo(ticket?.tipo || 'suporte');

    // 1. Gerar Transcript de texto
    let transcriptText = '==================================================\n' +
        '         TRANSCRIPT DE ATENDIMENTO - KENSAI STORE\n' +
        '==================================================\n' +
        'PROTOCOLO : ' + (protocolo || 'N/A') + '\n' +
        'TIPO       : ' + (ticket?.tipo || 'suporte').toUpperCase() + '\n' +
        'STATUS     : ' + (ticket?.statusCompra || 'CONCLUIDO') + '\n' +
        'CLIENTE    : ' + (ticket?.userTag || 'N/A') + ' (ID: ' + (ticket?.userId || 'N/A') + ')\n' +
        'FECHADO POR: ' + interaction.user.tag + ' (ID: ' + interaction.user.id + ')\n' +
        'DATA       : ' + new Date().toLocaleString('pt-BR') + '\n' +
        '==================================================\n\n';

    const staffMsgCounts = {};
    try {
        const msgs = await channel.messages.fetch({ limit: 100 });
        const ordenadas = Array.from(msgs.values()).reverse();
        ordenadas.forEach(function(m) {
            const dataHora = m.createdAt.toLocaleString('pt-BR');
            transcriptText += '[' + dataHora + '] ' + m.author.tag + ': ' + (m.content || '(Embed / Anexo)') + '\n';

            // Contagem de Mensagens Staff (exclui bots e o próprio cliente do ticket)
            if (!m.author.bot && m.author.id !== ticket?.userId) {
                if (!staffMsgCounts[m.author.id]) {
                    staffMsgCounts[m.author.id] = {
                        count: 0,
                        tag: m.author.tag,
                        mention: '<@' + m.author.id + '>'
                    };
                }
                staffMsgCounts[m.author.id].count++;
            }
        });
    } catch (e) {
        transcriptText += '\n[Aviso: Não foi possível obter todas as mensagens da sala.]\n';
    }

    // Formatação solicitada:
    // Contagem de Mensagens Staff
    // [ 4 ] - @Kira
    // [ 1 ] - @Dudu.yrs
    let staffContagemStr = 'Nenhuma mensagem enviada pela staff.';
    const staffEntries = Object.values(staffMsgCounts).sort(function(a, b) {
        return b.count - a.count;
    });
    if (staffEntries.length > 0) {
        staffContagemStr = staffEntries.map(function(s) {
            return '[ ' + s.count + ' ] - ' + s.mention;
        }).join('\n');
    }

    transcriptText += '\n==================================================\n' +
        'CONTAGEM DE MENSAGENS STAFF:\n' +
        (staffEntries.length > 0
            ? staffEntries.map(function(s) { return '[ ' + s.count + ' ] - ' + s.tag; }).join('\n')
            : 'Nenhuma mensagem de staff enviada.') + '\n' +
        '==================================================\n';

    // 2. Enviar Log no canal configurado
    if (sysConfig.canal_logs_id) {
        const logChannel = guild.channels.cache.get(sysConfig.canal_logs_id);
        if (logChannel) {
            const buffer = Buffer.from(transcriptText, 'utf8');
            const attachment = new AttachmentBuilder(buffer, { name: 'transcript-' + protocolo + '.txt' });

            let statusCompraStr = 'Atendimento Concluído';
            if (ticket?.tipo === 'tokens') {
                if (ticket.statusCompra === 'APROVADO') statusCompraStr = '🟢 Pago & Entregue com Sucesso';
                else if (ticket.statusCompra === 'RECUSADO') statusCompraStr = '🔴 Pedido Recusado / Cancelado';
                else statusCompraStr = '🟡 Encerrado sem Validação Expressa';
            } else if (ticket?.tipo === 'itens') {
                if (ticket.statusCompra === 'APROVADO') statusCompraStr = '🟢 Item Entregue com Sucesso';
                else if (ticket.statusCompra === 'RECUSADO') statusCompraStr = '🔴 Cancelado';
                else statusCompraStr = '🟡 Encerrado';
            }

            const logEmbed = criarEmbedPadrao('📁 Ticket Encerrado • ' + (protocolo || 'N/A'))
                .addFields(
                    { name: '📋 Protocolo', value: '`' + protocolo + '`', inline: true },
                    { name: '🏷️ Tipo', value: (ticket?.tipo || 'suporte').toUpperCase(), inline: true },
                    { name: '📦 Status da Compra', value: statusCompraStr, inline: true },
                    { name: '👤 Cliente', value: ticket?.userId ? '<@' + ticket.userId + '>' : 'N/A', inline: true },
                    { name: '🛡️ Fechado por', value: interaction.user.toString(), inline: true },
                    { name: '⏰ Data de Fechamento', value: '<t:' + Math.floor(Date.now() / 1000) + ':f>', inline: true },
                    { name: 'Contagem de Mensagens Staff', value: staffContagemStr, inline: false }
                )
                .setFooter({ text: 'Kensai Store • Sistema de Logs' });

            if (ticket?.tipo === 'tokens' && ticket?.detalhes) {
                const qtdNum = Number(ticket.detalhes.quantidade || 1000);
                const preco1k = Number(sysConfig.preco_por_1k || 18.50);
                const valorTot = (qtdNum / 1000) * preco1k;
                logEmbed.addFields({
                    name: TOKEN_EMOJI_STR + ' Detalhes da Venda',
                    value: '`' + qtdNum.toLocaleString('pt-BR') + ' Tokens` por `R$ ' + valorTot.toFixed(2).replace('.', ',') + '`',
                    inline: false
                });
            }

            await logChannel.send({ embeds: [logEmbed], files: [attachment] }).catch(function(err) {
                console.error('Erro ao enviar log do ticket:', err);
            });
        }
    }

    // Atualiza estado
    if (ticket) {
        ticket.fechado = true;
        ticket.fechadoPor = interaction.user.id;
        ticket.fechadoEm = Date.now();
        ativos[protocolo] = ticket;
        writeData('tickets_ativos', ativos);
    }

    // 3. Deleta o canal após 5 segundos
    setTimeout(function() {
        channel.delete('Ticket fechado por ' + interaction.user.tag).catch(function() {});
    }, 5000);
}

/**
 * Staff assume o atendimento do ticket
 */
async function assumirTicket(interaction, protocolo) {
    const channel = interaction.channel;
    const ativos = readData('tickets_ativos', {});
    const ticket = ativos[protocolo];

    if (ticket) {
        ticket.staffId = interaction.user.id;
        ativos[protocolo] = ticket;
        writeData('tickets_ativos', ativos);

        await channel.setTopic(
            (channel.topic || '') + ' | Atendente: ' + interaction.user.tag
        ).catch(function() {});

        return interaction.reply({
            content: '✋ ' + interaction.user.toString() + ' assumiu o atendimento deste ticket!'
        });
    }

    return interaction.reply({
        content: '❌ Ticket não encontrado nos registros.',
        flags: [MessageFlags.Ephemeral]
    });
}

/**
 * Menciona o cliente e tenta enviar alerta na DM
 */
async function chamarCliente(interaction, protocolo) {
    const ativos = readData('tickets_ativos', {});
    const ticket = ativos[protocolo];

    if (!ticket) {
        return interaction.reply({
            content: '❌ Ticket não encontrado.',
            flags: [MessageFlags.Ephemeral]
        });
    }

    const clienteId = ticket.userId;
    await interaction.channel.send({
        content: '🔔 <@' + clienteId + '>, a Staff está aguardando seu retorno neste ticket!'
    });

    try {
        const user = await interaction.client.users.fetch(clienteId);
        if (user) {
            await user.send({
                embeds: [
                    criarEmbedPadrao('🔔 Chamado da Staff • Kensai Store')
                        .setDescription(
                            'Olá! Nossa equipe está aguardando você no ticket **' + protocolo + '** em **' + interaction.guild.name + '**!\n\n' +
                            '👉 Clique para ir direto ao canal: ' + interaction.channel.toString()
                        )
                ]
            });
        }
    } catch (e) {
        // DM fechada
    }

    return interaction.reply({
        content: '✅ Cliente notificado com sucesso!',
        flags: [MessageFlags.Ephemeral]
    });
}

module.exports = {
    TOKEN_EMOJI_STR,
    gerarProtocolo,
    abrirTicket,
    fecharTicket,
    assumirTicket,
    chamarCliente,
    aprovarCompraToken,
    recusarCompraToken,
    aprovarEntregaItem
};
