const { executeRoleplayPrefix } = require('../../utils/roleplay');

module.exports = {
    name: 'cafune',
    aliases: ["cafuné","afago"],
    description: 'Faz um cafuné carinhoso na cabeça de alguém.',
    async execute(message, args) {
        return executeRoleplayPrefix(message, 'pat', args);
    }
};
