const { executeRoleplayPrefix } = require('../../utils/roleplay');

module.exports = {
    name: 'tapa',
    aliases: ["bater","tabefe","bofetada"],
    description: 'Dá um tapa/bofetada em alguém!',
    async execute(message, args) {
        return executeRoleplayPrefix(message, 'slap', args);
    }
};
