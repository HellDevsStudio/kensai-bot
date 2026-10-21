const { SlashCommandBuilder } = require('discord.js');
const { executeRoleplaySlash, executeRoleplayRetribuir } = require('../../utils/roleplay');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('beijar')
        .setDescription('Dá um beijo doce e carinhoso em alguém.')
        .addUserOption(opt =>
            opt.setName('alvo')
                .setDescription('Quem você deseja interagir?')
                .setRequired(true)
        ),
    async execute(interaction) {
        return executeRoleplaySlash(interaction, 'kiss');
    },
    async executeRetribuir(interaction, originalAuthorId) {
        return executeRoleplayRetribuir(interaction, originalAuthorId, 'kiss');
    }
};
