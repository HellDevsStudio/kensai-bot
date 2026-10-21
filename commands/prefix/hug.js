const { executeRoleplayPrefix } = require('../../utils/roleplay');

module.exports = {
    name: 'hug',
    aliases: ["abracar","abraçar","abraco"],
    description: 'Dá um abraço quentinho em alguém!',
    async execute(message, args) {
        return executeRoleplayPrefix(message, 'hug', args);
    }
};
