const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    MessageFlags
} = require('discord.js');
const { isStaff, checkPermission, NO_PERMISSION_MSG } = require('../../utils/permissions');
const { getTokensConfig, getItensConfig, getSuporteConfig } = require('../../utils/ticketConfigs');
const {
    gerarCobrancaPixPayload,
    identificarPagadorTicket,
    handlePixButton
} = require('../../utils/pix');

function ehStaffAutorizado(member) {
    if (!member) return false;
    if (member.permissions && member.permissions.has(PermissionFlagsBits.Administrator)) return true;
    if (isStaff(member) || checkPermission(member, PermissionFlagsBits.ManageMessages)) {
        return true;
    }
    const tok = getTokensConfig();
    const itn = getItensConfig();
    const sup = getSuporteConfig();
    const staffRoles = [tok.cargo_staff_id, itn.cargo_staff_id, sup.cargo_staff_id].filter(Boolean);
    return staffRoles.some(rId => member.roles.cache.has(rId));
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pix')
        .setDescription('Gera cobrança Pix com QR Code oficial e valor exato da Kensai Store.')
        .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages)
        .addStringOption(opt =>
            opt.setName('valor')
                .setDescription('Valor exato da cobrança em Reais (Ex: 15.50 ou 15,00)')
                .setRequired(true)
        )
        .addUserOption(opt =>
            opt.setName('usuario')
                .setDescription('Cliente pagador (Opcional - se vazio, identifica sozinho quem abriu o ticket)')
                .setRequired(false)
        ),

    async execute(interaction) {
        if (!ehStaffAutorizado(interaction.member)) {
            return interaction.reply({
                content: NO_PERMISSION_MSG,
                flags: [MessageFlags.Ephemeral]
            });
        }

        const valorRaw = interaction.options.getString('valor');
        const valorLimpo = parseFloat(valorRaw.replace(/[^0-9,\.]/g, '').replace(',', '.'));

        if (isNaN(valorLimpo) || valorLimpo <= 0) {
            return interaction.reply({
                content: '❌ Valor de Pix inválido. Informe um número como `15.50` ou `15,00`.',
                flags: [MessageFlags.Ephemeral]
            });
        }

        await interaction.deferReply().catch(() => {});

        let targetUserId = null;
        const targetUserOption = interaction.options.getUser('usuario');

        if (targetUserOption) {
            targetUserId = targetUserOption.id;
        } else {
            const pagadorTicket = identificarPagadorTicket(interaction.channelId, interaction.channel);
            if (pagadorTicket && pagadorTicket.userId) {
                targetUserId = pagadorTicket.userId;
            } else {
                targetUserId = interaction.user.id;
            }
        }

        try {
            const cobranca = await gerarCobrancaPixPayload({
                valor: valorLimpo,
                targetUserId,
                guild: interaction.guild,
                channelId: interaction.channelId,
                channel: interaction.channel
            });

            await interaction.editReply({
                content: '⚡ **Cobrança Pix gerada para** <@' + targetUserId + '>',
                embeds: cobranca.embeds,
                files: cobranca.files,
                components: cobranca.components
            });

            // Envia o código Copia e Cola limpo como mensagem normal
            await interaction.channel.send(cobranca.payloadPix).catch(() => {});
        } catch (err) {
            console.error('Erro ao gerar cobrança Pix:', err);
            return interaction.editReply({
                content: '❌ Ocorreu um erro ao gerar a cobrança Pix. Verifique a chave configurada.'
            });
        }
    },

    handleButton: handlePixButton
};