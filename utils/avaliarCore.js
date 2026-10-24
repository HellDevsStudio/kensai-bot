const { 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    ModalBuilder, 
    TextInputBuilder, 
    TextInputStyle, 
    PermissionsBitField, 
    MessageFlags 
} = require('discord.js');
const { readData, writeData } = require('./db');
const { isStaff, checkPermission } = require('./permissions');
const { getTokensConfig, getItensConfig, getSuporteConfig } = require('./ticketConfigs');
const config = require('../config');

const FEEDBACK_CHANNEL_ID = '1560093479458177154';

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
    return staffRoles.some(rId => member.roles?.cache?.has(rId));
}

/**
 * Identifica o atendente e o cliente do ticket no canal atual
 */
function identificarPartesTicket(channelId, channel = null, executor = null) {
    let staffId = null;
    let clienteId = null;

    if (channelId) {
        try {
            const ativos = readData('tickets_ativos', {});
            const ticket = Object.values(ativos).find(t => t.channelId === channelId);
            if (ticket) {
                clienteId = ticket.userId || ticket.clienteId || null;
                staffId = ticket.staffId || ticket.assumidoPor || ticket.aprovadoPor || ticket.fechadoPor || null;
            }
        } catch (_) {}
    }

    // Se clienteId não for achado no banco, procura nos permissionOverwrites
    if (!clienteId && channel && channel.permissionOverwrites) {
        try {
            for (const [id, overwrite] of channel.permissionOverwrites.cache) {
                const isMemberType = overwrite.type === 1 || overwrite.type === 'member';
                const botId = channel.client?.user?.id;
                if (isMemberType && (!botId || id !== botId)) {
                    if (overwrite.allow && overwrite.allow.has(PermissionsBitField.Flags.ViewChannel)) {
                        // Se não for o executor (quando executor for staff), é o cliente
                        if (!executor || id !== executor.id) {
                            clienteId = id;
                            break;
                        }
                    }
                }
            }
        } catch (_) {}
    }

    // Se staffId não foi definido pelo ticket, mas quem chamou o comando é Staff:
    if (!staffId && executor) {
        const member = channel?.guild?.members?.cache?.get(executor.id);
        if (member && ehStaffAutorizado(member)) {
            staffId = executor.id;
        }
    }

    return { staffId, clienteId };
}

/**
 * Cria a mensagem com o botão [ ⭐ Avalie Aqui ]
 */
function gerarPainelAvaliacaoPayload({ staffId, clienteId, guild }) {
    const userMention = clienteId ? `<@${clienteId}>` : '`Cliente`';
    const staffMention = staffId ? `<@${staffId}>` : '`Staff Kensai`';

    const embed = new EmbedBuilder()
        .setColor(config.EMBED_COLOR || 0x9a2ea6)
        .setAuthor({
            name: '⛩️ KENSAI STORE • AVALIAÇÃO DE ATENDIMENTO',
            iconURL: guild?.iconURL ? guild.iconURL({ dynamic: true }) : undefined
        })
        .setTitle('⭐ Como foi seu atendimento?')
        .setDescription(
            '> 🛡️ **Sua opinião é fundamental:** Avalie nosso atendimento para nos ajudar a manter a excelência e rapidez!\n\n' +
            `• 👤 **Cliente:** ${userMention}\n` +
            `• 🛡️ **Atendente / Vendedor:** ${staffMention}\n\n` +
            'Clique no botão **Avalie Aqui** abaixo para dar sua nota (1 a 5 estrelas) e deixar seu depoimento!'
        )
        .setFooter({ text: 'Kensai Store — Transparência e Confiança' })
        .setTimestamp();

    const customId = `btn_avaliar_${staffId || 'none'}_${clienteId || 'none'}`;

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(customId)
            .setLabel('Avalie Aqui')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('⭐')
    );

    return {
        embeds: [embed],
        components: [row]
    };
}

/**
 * Trata o clique no botão [ Avalie Aqui ]
 */
async function handleAvaliarButton(interaction) {
    const cid = interaction.customId; // btn_avaliar_{staffId}_{clienteId}
    const parts = cid.replace('btn_avaliar_', '').split('_');
    const staffId = parts[0] !== 'none' ? parts[0] : null;
    const clienteId = parts[1] !== 'none' ? parts[1] : null;

    // 1. Não permite que o próprio atendente se avalie
    if (staffId && interaction.user.id === staffId) {
        return interaction.reply({
            content: '❌ Você não pode avaliar o seu próprio atendimento!',
            flags: [MessageFlags.Ephemeral]
        });
    }

    // 2. Se o cliente do ticket estiver fixado, impede terceiros
    if (clienteId && interaction.user.id !== clienteId) {
        return interaction.reply({
            content: `❌ Apenas o cliente deste ticket (<@${clienteId}>) pode realizar esta avaliação!`,
            flags: [MessageFlags.Ephemeral]
        });
    }

    // 3. Abre o Modal para avaliação
    const modal = new ModalBuilder()
        .setCustomId(`modal_avaliar_${staffId || 'none'}`)
        .setTitle('Avaliação de Atendimento');

    const inputNota = new TextInputBuilder()
        .setCustomId('input_nota')
        .setLabel('Nota do Atendimento (1 a 5)')
        .setPlaceholder('Digite um número de 1 a 5 (Ex: 5)')
        .setValue('5')
        .setMinLength(1)
        .setMaxLength(1)
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

    const inputComentario = new TextInputBuilder()
        .setCustomId('input_comentario')
        .setLabel('Depoimento / Comentário')
        .setPlaceholder('Escreva seu depoimento sobre nosso atendimento...')
        .setMinLength(2)
        .setMaxLength(1000)
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true);

    modal.addComponents(
        new ActionRowBuilder().addComponents(inputNota),
        new ActionRowBuilder().addComponents(inputComentario)
    );

    return interaction.showModal(modal);
}

/**
 * Trata o envio do formulário Modal de Avaliação
 */
async function handleAvaliarModal(interaction) {
    const staffIdRaw = interaction.customId.replace('modal_avaliar_', '');
    const staffId = staffIdRaw !== 'none' ? staffIdRaw : interaction.guild?.ownerId;

    const notaRaw = interaction.fields.getTextInputValue('input_nota');
    const comentario = interaction.fields.getTextInputValue('input_comentario').trim();

    let nota = parseInt(notaRaw.replace(/[^0-9]/g, ''), 10);
    if (isNaN(nota) || nota < 1) nota = 5;
    if (nota > 5) nota = 5;

    const estrelasCheias = '⭐'.repeat(nota);
    const estrelasVazias = '☆'.repeat(5 - nota);
    const estrelasTexto = estrelasCheias + estrelasVazias;

    // 1. Grava no banco de reputação
    if (staffId) {
        try {
            const repData = readData('reputacao', {});
            repData[staffId] = repData[staffId] || { points: 0, reviews: [] };
            repData[staffId].points += nota;
            repData[staffId].reviews.push({
                authorId: interaction.user.id,
                authorTag: interaction.user.tag,
                nota: nota,
                comentario: comentario,
                date: Date.now()
            });
            writeData('reputacao', repData);
        } catch (e) {
            console.error('Erro ao salvar reputação:', e);
        }
    }

    // 2. Constrói o Embed exatamente no padrão do print enviado pelo usuário
    const embedReview = new EmbedBuilder()
        .setColor(config.EMBED_COLOR || 0x9a2ea6)
        .setTitle('🌟 Nova Avaliação de Atendimento!')
        .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
        .addFields(
            { name: '👤 Cliente', value: `<@${interaction.user.id}>`, inline: true },
            { name: '🛡️ Atendente / Vendedor', value: `<@${staffId}>`, inline: true },
            { name: '⭐ Nota', value: `${estrelasTexto} (${nota}/5)`, inline: true },
            { name: '💬 Depoimento', value: `> ${comentario}` }
        )
        .setFooter({ text: 'Kensai Store — Transparência e Confiança' })
        .setTimestamp();

    // 3. Envia no canal atual do ticket
    await interaction.channel.send({ embeds: [embedReview] }).catch(() => {});

    // 4. Envia no canal de feedback (1560093479458177154)
    try {
        const canalFeedback = interaction.guild?.channels?.cache?.get(FEEDBACK_CHANNEL_ID) ||
            await interaction.guild?.channels?.fetch(FEEDBACK_CHANNEL_ID).catch(() => null);

        if (canalFeedback) {
            await canalFeedback.send({ embeds: [embedReview] });
        }
    } catch (err) {
        console.error('Erro ao enviar feedback para o canal 1560093479458177154:', err.message);
    }

    // 5. Desativa o botão da mensagem original para evitar avaliações duplicadas
    try {
        await interaction.message?.edit({
            components: [
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('btn_avaliado_concluido')
                        .setLabel('Avaliação Enviada')
                        .setStyle(ButtonStyle.Success)
                        .setEmoji('⭐')
                        .setDisabled(true)
                )
            ]
        });
    } catch (_) {}

    // 6. Confirmação efêmera para o cliente
    return interaction.reply({
        content: '✅ Sua avaliação foi enviada com sucesso! Muito obrigado pelo feedback.',
        flags: [MessageFlags.Ephemeral]
    });
}

module.exports = {
    FEEDBACK_CHANNEL_ID,
    identificarPartesTicket,
    gerarPainelAvaliacaoPayload,
    handleAvaliarButton,
    handleAvaliarModal
};
