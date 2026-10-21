const { PermissionFlagsBits } = require('discord.js');
const config = require('../config');

function hasStaffPermission(interactionOrMessage) {
    const member = interactionOrMessage.member;
    if (!member) return false;

    // Administrador ou dono do servidor sempre têm permissão
    if (member.permissions.has(PermissionFlagsBits.Administrator)) return true;
    if (interactionOrMessage.guild?.ownerId === member.id) return true;

    // Cargos configurados na lista de staff
    if (Array.isArray(config.STAFF_ROLE_IDS) && config.STAFF_ROLE_IDS.length > 0) {
        return config.STAFF_ROLE_IDS.some(roleId => member.roles.cache.has(roleId));
    }

    return false;
}

module.exports = {
    hasStaffPermission
};
