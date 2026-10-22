const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    ChannelType,
    PermissionsBitField,
    MessageFlags,
    AttachmentBuilder
} = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('../config');
const { getItensConfig } = require('./ticketConfigs');
const { readData, writeData } = require('./db');
const { checkPermission, isStaff } = require('./permissions');

const ESTOQUE_PATH = path.join(__dirname, '..', 'data', 'estoque.json');

/**
 * Lê o estoque atual de itens
 */
function lerEstoque() {
    try {
        if (fs.existsSync(ESTOQUE_PATH)) {
            return JSON.parse(fs.readFileSync(ESTOQUE_PATH, 'utf8'));
        }
    } catch (e) {
        console.error('Erro ao ler estoque.json:', e);
    }
    return [];
}

/**
 * Salva o estoque de forma atômica
 */
function salvarEstoque(estoque) {
    try {
        const dir = path.dirname(ESTOQUE_PATH);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        const tmp = ESTOQUE_PATH + '.tmp';
        fs.writeFileSync(tmp, JSON.stringify(estoque, null, 2), 'utf8');
        fs.renameSync(tmp, ESTOQUE_PATH);
    } catch (e) {
        console.error('Erro ao salvar estoque.json:', e);
    }
}

/**
 * Decrementa a quantidade em estoque de um item
 */
function decrementarEstoque(itemId, quantidade = 1) {
    const estoque = lerEstoque();
    const idx = estoque.findIndex(i => String(i.id) === String(itemId) || i.nome.toLowerCase() === String(itemId).toLowerCase());
    if (idx === -1) return { baixou: false, motivo: 'nao_encontrado' };

    const item = estoque[idx];
    const qtdAtual = Number(item.quantidade || 0);
    if (qtdAtual <= 0) return { baixou: false, motivo: 'sem_saldo', novaQtd: 0 };

    const novaQtd = Math.max(0, qtdAtual - quantidade);
    item.quantidade = novaQtd;
    salvarEstoque(estoque);
    return { baixou: true, novaQtd, item };
}

/**
 * Abre o ticket de item ou pedido personalizado
 */
async function abrirTicketItem(interaction, categoria, item) {
    const guild = interaction.guild;
    const user = interaction.user;
    const itensCfg = getItensConfig();

    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] }).catch(() => {});

    // Verifica se já possui ticket ativo
    const ativos = readData('tickets_ativos', {});
    const jaAberto = Object.values(ativos).find(t => {
        return t.userId === user.id && !t.fechado && (t.tipo === 'itens' || t.tipo === 'item');
    });

    if (jaAberto) {
        const canalExistente = guild.channels.cache.get(jaAberto.channelId);
        if (canalExistente) {
            return interaction.editReply({
                content: `⚠️ Você já possui um ticket de itens aberto em <#${jaAberto.channelId}>!`
            });
        }
    }

    const protocolo = 'KS-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    const nomeLimpo = item 
        ? item.nome.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 15)
        : (categoria || 'personalizado').toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 15);
    const userLimpo = user.username.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 12);
    const nomeCanal = (item ? '🗡️-' : '📦-') + nomeLimpo + '-' + userLimpo;

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
        }
    ];

    if (itensCfg.cargo_staff_id && guild.roles.cache.has(itensCfg.cargo_staff_id)) {
        permissionOverwrites.push({
            id: itensCfg.cargo_staff_id,
            allow: [
                PermissionsBitField.Flags.ViewChannel,
                PermissionsBitField.Flags.SendMessages,
                PermissionsBitField.Flags.AttachFiles,
                PermissionsBitField.Flags.ReadMessageHistory
            ]
        });
    }

    let canal;
    try {
        canal = await guild.channels.create({
            name: nomeCanal,
            type: ChannelType.GuildText,
            parent: itensCfg.categoria_id || null,
            permissionOverwrites: permissionOverwrites,
            topic: `📌 Protocolo: ${protocolo} | Tipo: ITENS | Item: ${item ? item.nome : categoria} | Cliente: ${user.tag}`
        });
    } catch (error) {
        console.error('Erro ao criar sala do ticket de itens:', error);
        return interaction.editReply({
            content: '❌ Ocorreu um erro ao criar a sala do ticket. Verifique as permissões de canais do bot.'
        });
    }

    // Registra ticket ativo
    ativos[protocolo] = {
        protocolo: protocolo,
        tipo: 'itens',
        userId: user.id,
        userTag: user.tag,
        channelId: canal.id,
        guildId: guild.id,
        abertoEm: Date.now(),
        itemId: item?.id || null,
        itemNome: item?.nome || `Pedido Personalizado (${categoria})`,
        itemPreco: item?.preco || null,
        statusCompra: 'AGUARDANDO',
        staffId: null,
        fechado: false
    };
    writeData('tickets_ativos', ativos);

    // Constrói Embed de Atendimento
    let embedTicket;
    if (item) {
        const precoStr = Number(item.preco).toFixed(2).replace('.', ',');
        embedTicket = new EmbedBuilder()
            .setColor(config.EMBED_COLOR || 0x9a2ea6)
            .setTitle(`🛒 PEDIDO: ${item.nome.toUpperCase()}`)
            .setDescription(
                `Olá ${user.toString()}!\n\n` +
                `Você selecionou o item abaixo. Envie o seu **Nick do jogo / Roblox** e o **comprovante de pagamento Pix** assim que realizar a transferência.\n\n` +
                `> 📦 **Item:** \`${item.nome}\`\n` +
                `> 💰 **Valor:** \`R$ ${precoStr}\`\n` +
                `> 📋 **Protocolo:** \`${protocolo}\`\n\n` +
                `⚠️ *Após a confirmação da Staff, o item será entregue no seu servidor privado.*`
            )
            .setTimestamp()
            .setFooter({ text: `Kensai Store • Protocolo ${protocolo}` });

        if (item.imagem) {
            embedTicket.setImage(item.imagem);
        }
    } else {
        embedTicket = new EmbedBuilder()
            .setColor(config.EMBED_COLOR || 0x9a2ea6)
            .setTitle(`📦 PEDIDO PERSONALIZADO: ${(categoria || 'Geral').toUpperCase()}`)
            .setDescription(
                `Olá ${user.toString()}!\n\n` +
                `Você solicitou um **Pedido Personalizado** de **${categoria || 'Itens'}**.\n` +
                `Por favor, descreva detalhadamente qual item, skin ou encomenda você procura para que nossa Staff possa verificar a disponibilidade e calcular o valor.\n\n` +
                `> 📋 **Protocolo:** \`${protocolo}\`\n\n` +
                `⚠️ *Os valores e detalhes da entrega serão alinhados diretamente aqui neste canal.*`
            )
            .setTimestamp()
            .setFooter({ text: `Kensai Store • Protocolo ${protocolo}` });
    }

    const rowBotoes = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('btn_item_assumir')
            .setLabel('Assumir Pedido')
            .setStyle(ButtonStyle.Success)
            .setEmoji('✋'),
        new ButtonBuilder()
            .setCustomId(`ticket_fechar_${protocolo}`)
            .setLabel('Fechar Ticket')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('🔒'),
        new ButtonBuilder()
            .setCustomId(`ticket_chamar_${protocolo}`)
            .setLabel('Chamar Cliente')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('🔔')
    );

    const staffMention = itensCfg.cargo_staff_id ? `<@&${itensCfg.cargo_staff_id}>` : '';
    await canal.send({
        content: `${user.toString()} ${staffMention}`.trim(),
        embeds: [embedTicket],
        components: [rowBotoes]
    });

    return interaction.editReply({
        content: `✅ Seu ticket foi aberto com sucesso em ${canal.toString()}!`
    });
}

/**
 * Trata as interações do sistema de itens (Selects e Botões)
 */
async function handleItemInteraction(interaction) {
    // 1. SELECT MENU — Categoria Selecionada
    if (interaction.isStringSelectMenu() && interaction.customId === 'menu_categoria_item') {
        const categoria = interaction.values[0];

        // Se for pedido personalizado, abre direto
        if (categoria === 'Personalizado') {
            return abrirTicketItem(interaction, 'Personalizado', null);
        }

        await interaction.deferReply({ flags: [MessageFlags.Ephemeral] }).catch(() => {});
        const estoque = lerEstoque();
        const itensDisponiveis = estoque.filter(i => {
            return i.categoria === categoria && Number(i.quantidade) > 0;
        });

        const emojiMap = {
            'Espada': '🗡️',
            'Emote': '🎭',
            'Explosão': '💥',
            'Limitados': '⏳'
        };
        const catEmoji = emojiMap[categoria] || '📦';

        if (itensDisponiveis.length === 0) {
            const embedSemEstoque = new EmbedBuilder()
                .setColor(0xef4444)
                .setTitle(`📦 ${categoria}s — Sem Estoque`)
                .setDescription(
                    `Não há **${categoria}s** disponíveis no estoque no momento.\n\n` +
                    `Você pode abrir um **Pedido Personalizado** para nossa Staff analisar o que você procura e negociar o valor diretamente!`
                );

            const rowSemEstoque = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`btn_personalizado_${categoria}`)
                    .setLabel('Fazer Pedido Personalizado')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('⚙️')
            );

            return interaction.editReply({
                embeds: [embedSemEstoque],
                components: [rowSemEstoque]
            });
        }

        // Monta opções com até 24 itens + opção de personalizado
        const options = itensDisponiveis.slice(0, 24).map(item => {
            const precoFormatado = Number(item.preco).toFixed(2).replace('.', ',');
            let desc = item.descricao ? `${item.descricao.slice(0, 45)} — R$ ${precoFormatado}` : `R$ ${precoFormatado} • ${item.quantidade} em estoque`;
            if (desc.length > 100) desc = desc.slice(0, 97) + '...';

            return new StringSelectMenuOptionBuilder()
                .setLabel(item.nome.slice(0, 100))
                .setDescription(desc)
                .setValue(`item_${item.id}`)
                .setEmoji(catEmoji);
        });

        // Adiciona personalizado no final
        options.push(
            new StringSelectMenuOptionBuilder()
                .setLabel('Pedido Personalizado')
                .setDescription('Solicitar item específico — valor negociável com a Staff')
                .setValue(`personalizado_${categoria}`)
                .setEmoji('⚙️')
        );

        const embedItens = new EmbedBuilder()
            .setColor(config.EMBED_COLOR || 0x9a2ea6)
            .setTitle(`${catEmoji} ${categoria}s Disponíveis`)
            .setDescription(
                `Temos **${itensDisponiveis.length}** item(ns) disponível(is) na categoria **${categoria}**.\n` +
                `Selecione abaixo o item que deseja comprar ou solicite um **Pedido Personalizado**.`
            );

        const rowSelect = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('menu_item_especifico')
                .setPlaceholder(`Escolha um item de ${categoria}...`)
                .addOptions(options)
        );

        return interaction.editReply({
            embeds: [embedItens],
            components: [rowSelect]
        });
    }

    // 2. SELECT MENU — Item Específico Selecionado
    if (interaction.isStringSelectMenu() && interaction.customId === 'menu_item_especifico') {
        const valor = interaction.values[0];

        if (valor.startsWith('personalizado_')) {
            const cat = valor.replace('personalizado_', '');
            return abrirTicketItem(interaction, cat, null);
        }

        await interaction.deferReply({ flags: [MessageFlags.Ephemeral] }).catch(() => {});
        const itemId = valor.replace('item_', '');
        const estoque = lerEstoque();
        const item = estoque.find(i => String(i.id) === String(itemId));

        if (!item || Number(item.quantidade) <= 0) {
            return interaction.editReply({
                content: '❌ Este item acabou de esgotar. Por favor, escolha outro item ou faça um pedido personalizado.'
            });
        }

        const precoStr = Number(item.preco).toFixed(2).replace('.', ',');
        const embedItem = new EmbedBuilder()
            .setColor(config.EMBED_COLOR || 0x9a2ea6)
            .setTitle(`🛒 ${item.nome}`)
            .setDescription(item.descricao || 'Item disponível no estoque oficial da Kensai Store.')
            .addFields(
                { name: '💰 Preço', value: `\`R$ ${precoStr}\``, inline: true },
                { name: '📦 Estoque', value: `\`${item.quantidade} disponível(is)\``, inline: true },
                { name: '🏷️ Categoria', value: `\`${item.categoria}\``, inline: true }
            )
            .setFooter({ text: 'Clique no botão abaixo para abrir o canal e finalizar seu pedido' });

        if (item.imagem) {
            embedItem.setImage(item.imagem);
        }

        const rowComprar = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`btn_comprar_${item.id}`)
                .setLabel(`Comprar por R$ ${precoStr}`)
                .setStyle(ButtonStyle.Success)
                .setEmoji('✅'),
            new ButtonBuilder()
                .setCustomId('btn_cancelar_compra')
                .setLabel('Cancelar')
                .setStyle(ButtonStyle.Secondary)
        );

        return interaction.editReply({
            embeds: [embedItem],
            components: [rowComprar]
        });
    }

    // 3. BOTÕES
    if (interaction.isButton()) {
        const cid = interaction.customId;

        // Cancelar Compra
        if (cid === 'btn_cancelar_compra') {
            return interaction.update({
                content: '❌ Compra cancelada.',
                embeds: [],
                components: []
            }).catch(() => {});
        }

        // Fazer Pedido Personalizado (quando sem estoque)
        if (cid.startsWith('btn_personalizado_')) {
            const cat = cid.replace('btn_personalizado_', '');
            return abrirTicketItem(interaction, cat, null);
        }

        // Comprar Item Selecionado
        if (cid.startsWith('btn_comprar_')) {
            const itemId = cid.replace('btn_comprar_', '');
            const estoque = lerEstoque();
            const item = estoque.find(i => String(i.id) === String(itemId));

            if (!item || Number(item.quantidade) <= 0) {
                return interaction.reply({
                    content: '❌ Esse item esgotou antes de você confirmar. Tente outro item.',
                    flags: [MessageFlags.Ephemeral]
                });
            }

            return abrirTicketItem(interaction, item.categoria, item);
        }

        // Assumir Pedido (Staff)
        if (cid === 'btn_item_assumir') {
            const itensCfg = getItensConfig();
            const isStaffMember = interaction.member.permissions.has(PermissionsBitField.Flags.Administrator) ||
                (itensCfg.cargo_staff_id && interaction.member.roles.cache.has(itensCfg.cargo_staff_id));

            if (!isStaffMember) {
                return interaction.reply({
                    content: '❌ Apenas membros da Staff podem assumir este atendimento!',
                    flags: [MessageFlags.Ephemeral]
                });
            }

            // Atualiza ticket
            const channel = interaction.channel;
            const ativos = readData('tickets_ativos', {});
            const ticket = Object.values(ativos).find(t => t.channelId === channel.id);
            if (ticket) {
                ticket.staffId = interaction.user.id;
                ticket.statusCompra = 'EM_ATENDIMENTO';
                ativos[ticket.protocolo] = ticket;
                writeData('tickets_ativos', ativos);
            }

            const embedAssumiu = new EmbedBuilder()
                .setColor(config.EMBED_COLOR || 0x9a2ea6)
                .setDescription(`✋ **Atendimento assumido por:** ${interaction.user.toString()}\nO atendente responderá em instantes.`);

            await channel.send({ embeds: [embedAssumiu] });

            return interaction.reply({
                content: '✅ Você assumiu este atendimento com sucesso!',
                flags: [MessageFlags.Ephemeral]
            });
        }
    }
}

module.exports = {
    lerEstoque,
    salvarEstoque,
    decrementarEstoque,
    abrirTicketItem,
    handleItemInteraction
};
