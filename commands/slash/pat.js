const { SlashCommandBuilder } = require('discord.js');
const { executeRoleplaySlash, executeRoleplayRetribuir } = require('../../utils/roleplay');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pat')
        .setDescription('Faz cafuné/carinho na cabeça de alguém!')
        .addUserOption(opt =>
            opt.setName('alvo')
                .setDescription('Quem você deseja interagir?')
                .setRequired(true)
        ),
    async execute(interaction) {
        return executeRoleplaySlash(interaction, 'pat');
    },
    async executeRetribuir(interaction, originalAuthorId) {
        return executeRoleplayRetribuir(interaction, originalAuthorId, 'pat');
    }
};
