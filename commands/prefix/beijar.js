const { executeRoleplayPrefix } = require('../../utils/roleplay');

module.exports = {
    name: 'beijar',
    aliases: ["beijo","beijinho","selinho"],
    description: 'Dá um beijo doce e carinhoso em alguém.',
    async execute(message, args) {
        return executeRoleplayPrefix(message, 'kiss', args);
    }
};
