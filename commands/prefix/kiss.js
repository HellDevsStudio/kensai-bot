const { executeRoleplayPrefix } = require('../../utils/roleplay');

module.exports = {
    name: 'kiss',
    aliases: ["beijar","beijo","selinho"],
    description: 'Dá um beijo especial em alguém!',
    async execute(message, args) {
        return executeRoleplayPrefix(message, 'kiss', args);
    }
};
