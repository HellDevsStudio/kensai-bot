const { SlashCommandBuilder } = require('discord.js');
const { executeRoleplaySlash, executeRoleplayRetribuir } = require('../../utils/roleplay');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('tocaaqui')
        .setDescription('Toca aqui com um amigo com um High Five!')
        .addUserOption(opt =>
            opt.setName('alvo')
                .setDescription('Quem você deseja interagir?')
                .setRequired(true)
        ),
    async execute(interaction) {
        return executeRoleplaySlash(interaction, 'highfive');
    },
    async executeRetribuir(interaction, originalAuthorId) {
        return executeRoleplayRetribuir(interaction, originalAuthorId, 'highfive');
    }
};
