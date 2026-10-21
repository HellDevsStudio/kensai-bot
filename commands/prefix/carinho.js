const { executeRoleplayPrefix } = require('../../utils/roleplay');

module.exports = {
    name: 'carinho',
    aliases: ["chamego"],
    description: 'Faz um carinho especial em alguém.',
    async execute(message, args) {
        return executeRoleplayPrefix(message, 'pat', args);
    }
};
