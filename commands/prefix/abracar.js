const { executeRoleplayPrefix } = require('../../utils/roleplay');

module.exports = {
    name: 'abracar',
    aliases: ["abraçar","abraco","abraço"],
    description: 'Dá um abraço quentinho e aconchegante em alguém.',
    async execute(message, args) {
        return executeRoleplayPrefix(message, 'hug', args);
    }
};
