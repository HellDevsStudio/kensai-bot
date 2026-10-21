const { SlashCommandBuilder } = require('discord.js');
const { executeRoleplaySlash, executeRoleplayRetribuir } = require('../../utils/roleplay');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('abracar')
        .setDescription('Dá um abraço quentinho e aconchegante em alguém.')
        .addUserOption(opt =>
            opt.setName('alvo')
                .setDescription('Quem você deseja interagir?')
                .setRequired(true)
        ),
    async execute(interaction) {
        return executeRoleplaySlash(interaction, 'hug');
    },
    async executeRetribuir(interaction, originalAuthorId) {
        return executeRoleplayRetribuir(interaction, originalAuthorId, 'hug');
    }
};
