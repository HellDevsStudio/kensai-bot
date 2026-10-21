const { executeRoleplayPrefix } = require('../../utils/roleplay');

module.exports = {
    name: 'tocaaqui',
    aliases: ["toca_aqui","toca","tocaqui"],
    description: 'Toca aqui com um amigo com um High Five!',
    async execute(message, args) {
        return executeRoleplayPrefix(message, 'highfive', args);
    }
};
