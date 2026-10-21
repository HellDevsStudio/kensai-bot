const { executeRoleplayPrefix } = require('../../utils/roleplay');

module.exports = {
    name: 'pat',
    aliases: ["cafune","cafuné","carinho"],
    description: 'Faz cafuné/carinho na cabeça de alguém!',
    async execute(message, args) {
        return executeRoleplayPrefix(message, 'pat', args);
    }
};
