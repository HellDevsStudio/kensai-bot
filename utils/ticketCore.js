const { 
    ChannelType, 
    PermissionFlagsBits, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    AttachmentBuilder, 
    MessageFlags 
} = require('discord.js');
const crypto = require('crypto');
const { criarEmbedPadrao, criarEmbedSucesso, criarEmbedErro } = require('./embeds');
const { readData, writeData } = require('./db');
const { getSuporteConfig, getTokensConfig, getItensConfig } = require('./ticketConfigs');

/**
 * Retorna o config adequado para o tipo de ticket
 */
function getConfigPorTipo(tipo) {
    if (tipo === 'tokens') return getTokensConfig();
    if (tipo === 'itens') return getItensConfig();
    return getSuporteConfig();
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

    const protocolo = 'KS-' + crypto.randomBytes(3).toString('hex').toUpperCase();
    const cleanUser = user.username.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 15) || 'cliente';
    const channelName = tipo + '-' + cleanUser;

    // Overwrites de permissão
    const permissionOverwrites = [
        {
            id: guild.id, // @everyone
            deny: [PermissionFlagsBits.ViewChannel]
        },
        {
            id: user.id,
            allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.AttachFiles,
                PermissionFlagsBits.ReadMessageHistory
            ]
        },
        {
            id: interaction.client.user.id,
            allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.ManageChannels,
                PermissionFlagsBits.ManageMessages,
                PermissionFlagsBits.ReadMessageHistory
            ]
        }
    ];

    if (sysConfig.cargo_staff_id) {
        permissionOverwrites.push({
            id: sysConfig.cargo_staff_id,
            allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.AttachFiles,
                PermissionFlagsBits.ReadMessageHistory
            ]
        });
    }

    let categoriaId = sysConfig.categoria_id;
    if (categoriaId && !guild.channels.cache.has(categoriaId)) {
        categoriaId = null;
    }

    let canal;
    try {
        canal = await guild.channels.create({
            name: channelName,
            type: ChannelType.GuildText,
            parent: categoriaId || null,
            topic: 'Atendimento ' + tipo.toUpperCase() + ' | Protocolo: ' + protocolo + ' | Cliente: ' + user.tag,
            permissionOverwrites: permissionOverwrites
        });
    } catch (createErr) {
        console.error('Erro ao criar canal de ticket:', createErr);
        return interaction.editReply({
            embeds: [criarEmbedErro('Falha ao Abrir Ticket', 'Não foi possível criar o canal do ticket. Verifique as permissões do bot!')]
        });
    }

    // Registra ticket ativo
    ativos[protocolo] = {
        protocolo: protocolo,
        tipo: tipo,
        userId: user.id,
        userTag: user.tag,
        channelId: canal.id,
        guildId: guild.id,
        abertoEm: Date.now(),
        detalhes: detalhes || null,
        staffId: null,
        fechado: false
    };
    writeData('tickets_ativos', ativos);

    // Constrói embed de boas-vindas do ticket
    let titulo = '🎫 Atendimento de Suporte';
    let desc = 'Olá ' + user.toString() + ', seja bem-vindo ao seu ticket de suporte da **Kensai Store**!\n\n' +
        'Descreva detalhadamente como podemos te ajudar. Um membro de nossa equipe atenderá você em breve.';

    if (tipo === 'tokens') {
        titulo = '💰 Compra de Tokens • Kensai Store';
        const qtdTokens = detalhes?.quantidade || '1.000';
        const valorReais = detalhes?.valor || 'R$ 18,50';
        const chavePix = sysConfig.chave_pix || 'financeiro@kensaistore.com';

        desc = 'Olá ' + user.toString() + ', seu pedido de **Tokens** foi iniciado com sucesso!\n\n' +
            '🪙 **Quantidade:** `' + Number(qtdTokens).toLocaleString('pt-BR') + ' Tokens`\n' +
            '💵 **Valor Total:** `' + valorReais + '`\n' +
            '🔑 **Chave Pix:** `' + chavePix + '`\n\n' +
            '📌 *Realize o pagamento e envie o comprovante diretamente neste chat para validação.*';
    } else if (tipo === 'itens') {
        titulo = '⚔️ Compra de Item • Kensai Store';
        const itemNome = detalhes?.nome || 'Item do Catálogo';
        const itemPreco = detalhes?.preco || 'A Combinar';
        const itemDesc = detalhes?.descricao || '';

        desc = 'Olá ' + user.toString() + ', você solicitou a compra do item:\n\n' +
            '⚔️ **Item:** `' + itemNome + '`\n' +
            '💵 **Preço:** `' + itemPreco + '`\n' +
            (itemDesc ? '📝 **Detalhes:** ' + itemDesc + '\n\n' : '\n') +
            '📌 *Nossa equipe entrará em contato logo abaixo para coordenar o pagamento e a entrega dentro do jogo.*';
    }

    const embedTicket = criarEmbedPadrao(titulo)
        .setDescription(desc)
        .addFields(
            { name: '📋 Protocolo', value: '`' + protocolo + '`', inline: true },
            { name: '👤 Cliente', value: user.toString(), inline: true },
            { name: '⏰ Horário', value: '<t:' + Math.floor(Date.now() / 1000) + ':R>', inline: true }
        )
        .setFooter({ text: 'Kensai Store • Protocolo ' + protocolo });

    const rowAcoes = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('ticket_fechar_' + protocolo)
            .setLabel('🔒 Fechar Ticket')
            .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
            .setCustomId('ticket_assumir_' + protocolo)
            .setLabel('✋ Assumir Atendimento')
            .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
            .setCustomId('ticket_chamar_' + protocolo)
            .setLabel('🔔 Chamar Cliente')
            .setStyle(ButtonStyle.Secondary)
    );

    const staffMention = sysConfig.cargo_staff_id ? '<@&' + sysConfig.cargo_staff_id + '>' : '';
    await canal.send({
        content: user.toString() + ' ' + staffMention,
        embeds: [embedTicket],
        components: [rowAcoes]
    });

    await interaction.editReply({
        content: '✅ Seu ticket foi aberto com sucesso em ' + canal.toString() + '!'
    });
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
        'CLIENTE    : ' + (ticket?.userTag || 'N/A') + ' (ID: ' + (ticket?.userId || 'N/A') + ')\n' +
        'FECHADO POR: ' + interaction.user.tag + ' (ID: ' + interaction.user.id + ')\n' +
        'DATA       : ' + new Date().toLocaleString('pt-BR') + '\n' +
        '==================================================\n\n';

    try {
        const msgs = await channel.messages.fetch({ limit: 100 });
        const ordenadas = Array.from(msgs.values()).reverse();
        ordenadas.forEach(function(m) {
            const dataHora = m.createdAt.toLocaleString('pt-BR');
            transcriptText += '[' + dataHora + '] ' + m.author.tag + ': ' + (m.content || '(Embed / Anexo)') + '\n';
        });
    } catch (e) {
        transcriptText += '\n[Aviso: Não foi possível obter todas as mensagens da sala.]\n';
    }

    // 2. Enviar Log no canal configurado
    if (sysConfig.canal_logs_id) {
        const logChannel = guild.channels.cache.get(sysConfig.canal_logs_id);
        if (logChannel) {
            const buffer = Buffer.from(transcriptText, 'utf8');
            const attachment = new AttachmentBuilder(buffer, { name: 'transcript-' + protocolo + '.txt' });

            const logEmbed = criarEmbedPadrao('📁 Ticket Encerrado • ' + (protocolo || 'N/A'))
                .addFields(
                    { name: '📋 Protocolo', value: '`' + protocolo + '`', inline: true },
                    { name: '🏷️ Tipo', value: (ticket?.tipo || 'suporte').toUpperCase(), inline: true },
                    { name: '👤 Cliente', value: ticket?.userId ? '<@' + ticket.userId + '>' : 'N/A', inline: true },
                    { name: '🛡️ Fechado por', value: interaction.user.toString(), inline: true },
                    { name: '⏰ Data de Fechamento', value: '<t:' + Math.floor(Date.now() / 1000) + ':f>', inline: true }
                )
                .setFooter({ text: 'Kensai Store • Sistema de Logs' });

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
    }

    await channel.setTopic(
        (channel.topic || '') + ' | Atendente: ' + interaction.user.username
    ).catch(function() {});

    await interaction.reply({
        content: '✋ **' + interaction.user.toString() + '** assumiu este atendimento!'
    });
}

/**
 * Notifica/chama o cliente para responder
 */
async function chamarCliente(interaction, protocolo) {
    const ativos = readData('tickets_ativos', {});
    const ticket = ativos[protocolo];

    if (!ticket || !ticket.userId) {
        return interaction.reply({
            content: '⚠️ Não foi possível identificar o cliente deste ticket.',
            flags: [MessageFlags.Ephemeral]
        });
    }

    const member = interaction.guild.members.cache.get(ticket.userId);

    // Mensagem no canal
    await interaction.reply({
        content: '🔔 <@' + ticket.userId + '>, nossa equipe está aguardando sua resposta para dar continuidade ao seu atendimento!'
    });

    // Notificação direta em DM se disponível
    if (member) {
        const embedDM = criarEmbedPadrao('🔔 Atualização no seu Ticket')
            .setDescription(
                'Olá! Um atendente da **Kensai Store** está aguardando você no seu canal de atendimento: <#' + interaction.channel.id + '>.\n\n' +
                'Por favor, acesse o servidor para responder!'
            )
            .setFooter({ text: 'Protocolo ' + protocolo });

        member.send({ embeds: [embedDM] }).catch(function() {});
    }
}

module.exports = {
    abrirTicket,
    fecharTicket,
    assumirTicket,
    chamarCliente
};
