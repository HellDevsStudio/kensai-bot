const { executeRoleplayPrefix } = require('../../utils/roleplay');

module.exports = {
    name: 'highfive',
    aliases: ["tocaaqui","toca_aqui","toca","h5"],
    description: 'Manda aquele High Five / Toca aqui!',
    async execute(message, args) {
        return executeRoleplayPrefix(message, 'highfive', args);
    }
};
