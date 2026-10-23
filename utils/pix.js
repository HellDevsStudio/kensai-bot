const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');
const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    AttachmentBuilder,
    PermissionsBitField,
    MessageFlags
} = require('discord.js');
const { getTokensConfig, getItensConfig, getSuporteConfig } = require('./ticketConfigs');
const { isStaff, checkPermission } = require('./permissions');
const { readData, writeData } = require('./db');
const config = require('../config');

// Armazena payloads temporários para botões e controle de cobrança
const pixPayloadsCache = new Map();

// Limpeza automática de cache a cada 30 minutos
setInterval(() => {
    const agora = Date.now();
    for (const [id, item] of pixPayloadsCache.entries()) {
        if (agora - item.criadoEm > 60 * 60 * 1000) {
            pixPayloadsCache.delete(id);
        }
    }
}, 30 * 60 * 1000).unref();

function crc16(data) {
    let crc = 0xFFFF;
    for (let i = 0; i < data.length; i++) {
        crc ^= data.charCodeAt(i) << 8;
        for (let j = 0; j < 8; j++) {
            if ((crc & 0x8000) !== 0) crc = (crc << 1) ^ 0x1021;
            else crc <<= 1;
        }
    }
    return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
}

function normalizarTextoPix(str) {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
}

function ehStaffAutorizado(member) {
    if (!member) return false;
    if (member.permissions && member.permissions.has(PermissionsBitField.Flags.Administrator)) return true;
    if (isStaff(member) || checkPermission(member, PermissionsBitField.Flags.ManageMessages)) {
        return true;
    }
    const tok = getTokensConfig();
    const itn = getItensConfig();
    const sup = getSuporteConfig();
    const staffRoles = [tok.cargo_staff_id, itn.cargo_staff_id, sup.cargo_staff_id].filter(Boolean);
    return staffRoles.some(rId => member.roles && member.roles.cache && member.roles.cache.has(rId));
}

function gerarPixPayload({ chave, valor, nome = 'CAROLLINA FERNANDEZ', cidade = 'SAO PAULO' }) {
    const valorNum = typeof valor === 'string'
        ? parseFloat(valor.replace(/[^0-9,\.]/g, '').replace(',', '.'))
        : Number(valor);

    if (isNaN(valorNum) || valorNum <= 0) {
        throw new Error('Valor inválido para cobrança Pix');
    }

    const valorFormatado = valorNum.toFixed(2);
    const chaveLimpa = (chave || getTokensConfig().chave_pix || 'kensai.store.oficial@gmail.com').trim();
    const nomeLimpo = normalizarTextoPix(nome || 'CAROLLINA FERNANDEZ').slice(0, 25);
    const cidadeLimpa = normalizarTextoPix(cidade || 'SAO PAULO').slice(0, 15);

    const gui = '0014br.gov.bcb.pix';
    const subChave = '01' + chaveLimpa.length.toString().padStart(2, '0') + chaveLimpa;
    const tag26 = '26' + (gui.length + subChave.length).toString().padStart(2, '0') + gui + subChave;
    const tag54 = '54' + valorFormatado.length.toString().padStart(2, '0') + valorFormatado;
    const tag59 = '59' + nomeLimpo.length.toString().padStart(2, '0') + nomeLimpo;
    const tag60 = '60' + cidadeLimpa.length.toString().padStart(2, '0') + cidadeLimpa;

    const payloadSemCrc = [
        '000201',
        tag26,
        '52040000',
        '5303986',
        tag54,
        '5802BR',
        tag59,
        tag60,
        '62070503***',
        '6304'
    ].join('');

    const crc = crc16(payloadSemCrc);
    const payloadCompleto = payloadSemCrc + crc;

    return {
        payloadPix: payloadCompleto,
        valorFormatado,
        valorNum,
        chave: chaveLimpa,
        nome: 'Carollina Fernandez',
        nomeEmv: nomeLimpo,
        banco: 'Mercado Pago',
        cidade: cidadeLimpa
    };
}

async function gerarQrCodeBuffer(payloadPix) {
    try {
        return await QRCode.toBuffer(payloadPix, {
            width: 400,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#ffffff'
            }
        });
    } catch (e) {
        console.error('Erro ao gerar QR Code localmente via qrcode:', e.message);
        throw e;
    }
}

function identificarPagadorTicket(channelId, channel = null) {
    if (!channelId) return null;
    try {
        const ativos = readData('tickets_ativos', {});
        const ticket = Object.values(ativos).find(t => t.channelId === channelId);
        if (ticket && ticket.userId) {
            return {
                userId: ticket.userId,
                userTag: ticket.userTag || null,
                protocolo: ticket.protocolo || null,
                tipo: ticket.tipo || null,
                origem: 'ticket_banco'
            };
        }
    } catch (_) {}

    if (channel && channel.topic) {
        const match = channel.topic.match(/\b(\d{17,20})\b/);
        if (match) {
            return {
                userId: match[1],
                origem: 'canal_topico'
            };
        }
    }

    if (channel && channel.permissionOverwrites) {
        try {
            for (const [id, overwrite] of channel.permissionOverwrites.cache) {
                const isMemberType = overwrite.type === 1 || overwrite.type === 'member';
                const botId = channel.client?.user?.id;
                if (isMemberType && (!botId || id !== botId)) {
                    if (overwrite.allow && overwrite.allow.has(PermissionsBitField.Flags.ViewChannel)) {
                        return {
                            userId: id,
                            origem: 'canal_permission'
                        };
                    }
                }
            }
        } catch (_) {}
    }
    return null;
}

async function gerarCobrancaPixPayload({ valor, targetUserId, guild, channelId, channel = null }) {
    const dadosPix = gerarPixPayload({ valor });
    const qrBuffer = await gerarQrCodeBuffer(dadosPix.payloadPix);
    const attachment = new AttachmentBuilder(qrBuffer, { name: 'pix_qrcode.png' });

    const valorBonito = Number(dadosPix.valorNum).toFixed(2).replace('.', ',');
    const tempId = 'pix_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6);

    pixPayloadsCache.set(tempId, {
        payloadPix: dadosPix.payloadPix,
        chave: dadosPix.chave,
        valor: valorBonito,
        valorNum: dadosPix.valorNum,
        targetUserId: targetUserId || null,
        channelId: channelId || null,
        criadoEm: Date.now()
    });

    const userMention = targetUserId ? ('<@' + targetUserId + '>') : '`Não especificado`';

    const embed = new EmbedBuilder()
        .setColor(config.EMBED_COLOR || 0x9a2ea6)
        .setAuthor({
            name: '⛩️ KENSAI STORE • PAGAMENTO VIA PIX',
            iconURL: guild?.iconURL ? guild.iconURL({ dynamic: true }) : undefined
        })
        .setTitle('💳 Cobrança Pix • R$ ' + valorBonito)
        .setDescription(
            '> ⚡ **Pagamento Imediato:** Escaneie o QR Code abaixo pelo app do seu banco ou copie o código Pix enviado logo abaixo.\n' +
            '> 🛡️ **Garantia Kensai:** Procedência 100% auditada. Após o pagamento, envie o comprovante neste canal!\n\n' +
            '• 💰 **Valor a Pagar:** `' + 'R$ ' + valorBonito + '`\n' +
            '• 👤 **Pagador Identificado:** ' + userMention + '\n' +
            '• 🔑 **Chave Pix Oficial:** `' + dadosPix.chave + '`\n' +
            '• 🏢 **Beneficiário:** `Carollina Fernandez`\n' +
            '• 🏦 **Banco / Instituição:** `Mercado Pago`'
        )
        .setImage('attachment://pix_qrcode.png')
        .setFooter({ text: 'Kensai Store • A lâmina mais afiada do atendimento' })
        .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('btn_copiar_pix_' + tempId)
            .setLabel('Copiar Código Pix')
            .setStyle(ButtonStyle.Success)
            .setEmoji('📋'),
        new ButtonBuilder()
            .setCustomId('btn_chave_pix_' + tempId)
            .setLabel('Copiar Apenas a Chave')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('🔑'),
        new ButtonBuilder()
            .setCustomId('btn_confirmar_pix_' + tempId)
            .setLabel('Confirmar Pix')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('✅')
    );

    if (channelId) {
        try {
            const ativos = readData('tickets_ativos', {});
            const ticket = Object.values(ativos).find(t => t.channelId === channelId);
            if (ticket) {
                ticket.valorCobrado = dadosPix.valorNum;
                ticket.clienteId = targetUserId || ticket.userId;
                ticket.pixCopiaECola = dadosPix.payloadPix;
                ticket.pixBeneficiario = 'Carollina Fernandez';
                ticket.pixBanco = 'Mercado Pago';
                ticket.pixGeradoEm = Date.now();
                ticket.pixConfirmado = false;
                ativos[ticket.protocolo] = ticket;
                writeData('tickets_ativos', ativos);
            }
        } catch (_) {}
    }

    return {
        embeds: [embed],
        files: [attachment],
        components: [row],
        payloadPix: dadosPix.payloadPix,
        chave: dadosPix.chave,
        beneficiario: 'Carollina Fernandez',
        banco: 'Mercado Pago',
        valorBonito,
        userMention
    };
}

async function handlePixButton(interaction) {
    const cid = interaction.customId;

    // 1. Botão de Copiar Código Pix
    if (cid.startsWith('btn_copiar_pix_')) {
        const tempId = cid.replace('btn_copiar_pix_', '');
        const data = pixPayloadsCache.get(tempId);

        if (!data) {
            return interaction.reply({
                content: '⚠️ Este código Pix expirou do cache rápido. Copie diretamente da mensagem no canal.',
                flags: [MessageFlags.Ephemeral]
            });
        }

        return interaction.reply({
            content: data.payloadPix,
            flags: [MessageFlags.Ephemeral]
        });
    }

    // 2. Botão de Copiar Chave Pix
    if (cid.startsWith('btn_chave_pix_')) {
        const tempId = cid.replace('btn_chave_pix_', '');
        const data = pixPayloadsCache.get(tempId);
        const chave = data ? data.chave : (getTokensConfig().chave_pix || 'kensai.store.oficial@gmail.com');

        return interaction.reply({
            content: chave,
            flags: [MessageFlags.Ephemeral]
        });
    }

    // 3. Botão de Confirmar Pix (Apenas Staff)
    if (cid.startsWith('btn_confirmar_pix_')) {
        if (!ehStaffAutorizado(interaction.member)) {
            return interaction.reply({
                content: '❌ **Acesso negado:** Apenas membros da Staff podem confirmar pagamentos via Pix!',
                flags: [MessageFlags.Ephemeral]
            });
        }

        const tempId = cid.replace('btn_confirmar_pix_', '');
        const data = pixPayloadsCache.get(tempId);

        let valorBonito = data ? data.valor : null;
        let targetUserId = data ? data.targetUserId : null;

        // Fallback: extrai do embed da mensagem se cache expirou
        const embedOriginal = interaction.message?.embeds?.[0];
        if (!valorBonito && embedOriginal?.title) {
            const matchValor = embedOriginal.title.match(/R\$\s*([0-9.,]+)/i);
            if (matchValor) valorBonito = matchValor[1];
        }
        if (!targetUserId && embedOriginal?.description) {
            const matchUser = embedOriginal.description.match(/<@(\d+)>/);
            if (matchUser) targetUserId = matchUser[1];
        }
        if (!valorBonito) valorBonito = '0,00';

        const userMention = targetUserId ? ('<@' + targetUserId + '>') : '`Cliente`';

        // Imagem oficial de confirmação Kensai
        const assetPath = path.join(__dirname, '../kensai_assets/Desire_for_him_and_money_20261023185045.png');
        if (!fs.existsSync(assetPath)) {
            console.error('Arquivo de imagem de confirmação não encontrado em:', assetPath);
            return interaction.reply({
                content: '❌ Imagem de confirmação não encontrada no servidor.',
                flags: [MessageFlags.Ephemeral]
            });
        }

        const attachmentConfirmado = new AttachmentBuilder(assetPath, { name: 'pix_confirmado.png' });

        const embedConfirmado = new EmbedBuilder()
            .setColor(0x22c55e)
            .setAuthor({
                name: '⛩️ KENSAI STORE • PAGAMENTO CONFIRMADO',
                iconURL: interaction.guild?.iconURL ? interaction.guild.iconURL({ dynamic: true }) : undefined
            })
            .setTitle('✅ Pagamento Confirmado • R$ ' + valorBonito)
            .setDescription(
                '> 🛡️ **Garantia Kensai:** Procedência 100% auditada. O pagamento foi validado com sucesso pela nossa equipe!\n\n' +
                '• 💵 **Valor Confirmado:** `' + 'R$ ' + valorBonito + '`\n' +
                '• 👤 **Cliente:** ' + userMention + '\n' +
                '• 👮 **Confirmado por:** ' + interaction.user.toString() + '\n' +
                '• 🏢 **Beneficiário:** `Carollina Fernandez`\n' +
                '• 🏦 **Banco / Instituição:** `Mercado Pago`\n' +
                '• ⏰ **Confirmado em:** <t:' + Math.floor(Date.now() / 1000) + ':f>'
            )
            .setImage('attachment://pix_confirmado.png')
            .setFooter({ text: 'Kensai Store • Pagamento Aprovado com Sucesso' })
            .setTimestamp();

        const rowConfirmado = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('btn_pix_confirmado_ok')
                .setLabel('Confirmado por ' + interaction.user.username)
                .setStyle(ButtonStyle.Success)
                .setEmoji('✅')
                .setDisabled(true)
        );

        // Atualiza a mensagem original substituindo o QR Code pela imagem aprovada
        await interaction.update({
            embeds: [embedConfirmado],
            files: [attachmentConfirmado],
            components: [rowConfirmado]
        });

        // Atualiza banco do ticket
        const channelId = interaction.channelId;
        try {
            const ativos = readData('tickets_ativos', {});
            const ticket = Object.values(ativos).find(t => t.channelId === channelId);
            if (ticket) {
                ticket.statusCompra = 'APROVADO';
                ticket.pixConfirmado = true;
                ticket.aprovadoPor = interaction.user.id;
                ticket.aprovadoEm = Date.now();
                ativos[ticket.protocolo] = ticket;
                writeData('tickets_ativos', ativos);
            }
        } catch (_) {}

        // Notifica no canal
        await interaction.channel.send({
            content: '🎉 ' + userMention + ', seu pagamento via Pix de **R$ ' + valorBonito + '** foi **confirmado** por ' + interaction.user.toString() + '!'
        }).catch(() => {});
    }
}

module.exports = {
    crc16,
    gerarPixPayload,
    gerarQrCodeBuffer,
    identificarPagadorTicket,
    gerarCobrancaPixPayload,
    handlePixButton
};