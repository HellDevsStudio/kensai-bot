const { ActionRowBuilder, StringSelectMenuBuilder, PermissionsBitField } = require('discord.js');
const { criarEmbedPadrao, criarEmbedErro } = require('../../utils/embeds');
const { isStaff, checkPermission } = require('../../utils/permissions');
const { getTokensConfig, getItensConfig, getSuporteConfig } = require('../../utils/ticketConfigs');

function ehStaffAutorizado(member) {
    if (!member) return false;
    if (member.permissions && (member.permissions.has(PermissionsBitField.Flags.Administrator) || member.permissions.has(PermissionsBitField.Flags.ManageMessages))) {
        return true;
    }
    if (isStaff(member) || checkPermission(member, PermissionsBitField.Flags.ManageMessages)) {
        return true;
    }
    const tok = getTokensConfig();
    const itn = getItensConfig();
    const sup = getSuporteConfig();
    const staffRoles = [tok.cargo_staff_id, itn.cargo_staff_id, sup.cargo_staff_id].filter(Boolean);
    return staffRoles.some(rId => member.roles?.cache?.has(rId));
}

module.exports = {
    name: 'helpstaff',
    description: 'Central de comandos restritos para a Staff da Kensai Store.',
    aliases: ['ajudastaff', 'staffhelp', 'staffcomandos'],
    async execute(message, args, client) {
        if (!ehStaffAutorizado(message.member)) {
            return message.reply({ embeds: [criarEmbedErro('Acesso Negado', 'Este comando é exclusivo para membros da Staff da Kensai Store.')] });
        }

        const embed = criarEmbedPadrao(
            '🛡️ Kensai Store — Central da Staff',
            'Bem-vindo ao manual operacional da **Equipe Kensai**!\n\n' +
            'Utilize o menu dropdown abaixo para consultar os comandos administrativos, financeiros e de moderação.\n\n' +
            '• **Comandos no chat:** `k!pix`, `k!avaliar`, `k!copy`, `k!clear`, `k!warn`\n' +
            '• **Comandos Slash:** Você também pode usar `/helpstaff` de forma privada.'
        );

        const menu = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('helpstaff_category_select')
                .setPlaceholder('Escolha uma categoria da Staff...')
                .addOptions([
                    { label: 'Vendas & Finanças', value: 'vendas', description: 'Pix, avaliação, estoque e DM da loja', emoji: '💳' },
                    { label: 'Administração & Servidor', value: 'adm', description: 'Config, clonagem, lock, nuke e anúncios', emoji: '⚙️' },
                    { label: 'Moderação & Punições', value: 'mod', description: 'Clear, ban, kick, timeout e advertências', emoji: '🛡️' }
                ])
        );

        return message.reply({ embeds: [embed], components: [menu] });
    }
};