const { executeRoleplayPrefix } = require('../../utils/roleplay');

module.exports = {
    name: 'slap',
    aliases: ["tapa","bater","bofetada","tabefe"],
    description: 'Dá um tapa em alguém!',
    async execute(message, args) {
        return executeRoleplayPrefix(message, 'slap', args);
    }
};
