const { PermissionFlagsBits, PermissionsBitField } = require('discord.js');
const config = require('../config');

const PERMISSION_ERROR_MESSAGE = '❌ Você não tem permissão para empunhar esta lâmina!';
const NO_PERMISSION_MSG = PERMISSION_ERROR_MESSAGE;

function isStaff(memberOrInteraction) {
    if (!memberOrInteraction) return false;
    const member = memberOrInteraction.member || memberOrInteraction;
    if (!member || !member.permissions) return false;

    // Administrador ou dono do servidor sempre têm permissão
    if (typeof member.permissions.has === 'function' && member.permissions.has(PermissionFlagsBits.Administrator)) {
        return true;
    }
    if (member.guild?.ownerId && member.id && member.guild.ownerId === member.id) {
        return true;
    }

    // Cargos configurados na lista de staff
    if (Array.isArray(config.STAFF_ROLE_IDS) && config.STAFF_ROLE_IDS.length > 0) {
        if (config.STAFF_ROLE_IDS.some(roleId => member.roles?.cache?.has(roleId))) return true;
    }
    if (config.STAFF_ROLE_ID && member.roles?.cache?.has(config.STAFF_ROLE_ID)) return true;

    return false;
}

function hasStaffPermission(interactionOrMessage) {
    return isStaff(interactionOrMessage);
}

function checkPermission(memberOrInteraction, requiredPermission) {
    if (!memberOrInteraction) return false;
    const member = memberOrInteraction.member || memberOrInteraction;
    if (!member || !member.permissions) return false;

    if (typeof member.permissions.has === 'function') {
        if (member.permissions.has(PermissionFlagsBits.Administrator)) return true;
        if (requiredPermission && member.permissions.has(requiredPermission)) return true;
    }

    if (member.guild?.ownerId && member.id && member.guild.ownerId === member.id) {
        return true;
    }

    if (isStaff(member)) return true;

    return false;
}

function hasPermission(member, requiredPermission) {
    return checkPermission(member, requiredPermission);
}

function checkHierarchy(executor, target) {
    if (!executor && !target) return true;
    if (!executor || !target) return true;
    if (executor.guild?.ownerId && executor.id && executor.guild.ownerId === executor.id) return true;
    if (target.guild?.ownerId && target.id && target.guild.ownerId === target.id) return false;
    if (executor.id === target.id) return false;

    const execPos = executor.roles?.highest?.position ?? 0;
    const targetPos = target.roles?.highest?.position ?? 0;
    return execPos > targetPos;
}

function canModerate(moderator, target) {
    if (!moderator || !target) return false;
    if (target.id === moderator.id) return false;
    if (target.guild?.ownerId && target.id && target.guild.ownerId === target.id) return false;
    if (moderator.guild?.ownerId && moderator.id && moderator.guild.ownerId === moderator.id) return true;

    return checkHierarchy(moderator, target);
}

module.exports = {
    hasStaffPermission,
    hasPermission,
    canModerate,
    PERMISSION_ERROR_MESSAGE,
    isStaff,
    checkPermission,
    checkHierarchy,
    NO_PERMISSION_MSG
};
