const { PermissionsBitField } = require('discord.js');
const { isStaff, checkPermission, NO_PERMISSION_MSG } = require('../../utils/permissions');
const { getTokensConfig, getItensConfig, getSuporteConfig } = require('../../utils/ticketConfigs');
const {
    gerarCobrancaPixPayload,
    identificarPagadorTicket
} = require('../../utils/pix');

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
    return staffRoles.some(rId => member.roles.cache.has(rId));
}

module.exports = {
    name: 'pix',
    description: 'Gera cobrança Pix oficial com QR Code e valor exato.',
    aliases: ['gerarpix', 'cobrar', 'qrcode'],
    async execute(message, args) {
        if (!ehStaffAutorizado(message.member)) {
            return message.reply(NO_PERMISSION_MSG);
        }

        if (!args[0]) {
            return message.reply(
                '❌ **Uso incorreto:** informe o valor do Pix!\n' +
                '• Exemplo: `k!pix 15.50` (identifica automaticamente o dono do ticket)\n' +
                '• Exemplo com usuário: `k!pix 15.50 @cliente`'
            );
        }

        const valorLimpo = parseFloat(args[0].replace(/[^0-9,\.]/g, '').replace(',', '.'));
        if (isNaN(valorLimpo) || valorLimpo <= 0) {
            return message.reply('❌ Valor inválido. Digite um número como `15.50` ou `15,00`.');
        }

        let targetUserId = null;
        if (message.mentions && message.mentions.users && message.mentions.users.first()) {
            targetUserId = message.mentions.users.first().id;
        } else if (args[1] && /^\d{17,20}$/.test(args[1])) {
            targetUserId = args[1];
        } else {
            const pagadorTicket = identificarPagadorTicket(message.channel.id, message.channel);
            if (pagadorTicket && pagadorTicket.userId) {
                targetUserId = pagadorTicket.userId;
            } else {
                targetUserId = message.author.id;
            }
        }

        try {
            const cobranca = await gerarCobrancaPixPayload({
                valor: valorLimpo,
                targetUserId,
                guild: message.guild,
                channelId: message.channel.id,
                channel: message.channel
            });

            await message.reply({
                content: '⚡ **Cobrança Pix gerada para** <@' + targetUserId + '>',
                embeds: cobranca.embeds,
                files: cobranca.files,
                components: cobranca.components
            });

            await message.channel.send('```\n' + cobranca.payloadPix + '\n```').catch(() => {});
        } catch (err) {
            console.error('Erro ao gerar cobrança Pix via prefixo:', err);
            return message.reply('❌ Ocorreu um erro ao gerar a cobrança Pix.');
        }
    }
};