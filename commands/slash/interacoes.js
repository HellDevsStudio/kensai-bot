const { SlashCommandBuilder } = require('discord.js');
const { criarEmbedPadrao } = require('../../utils/embeds');
const { getPairSummary } = require('../../utils/roleplay');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('interacoes')
        .setDescription('Exibe o histórico e contador de interações entre você e outro membro.')
        .addUserOption(opt =>
            opt.setName('alvo')
                .setDescription('Membro para consultar o histórico')
                .setRequired(true)
        ),
    async execute(interaction) {
        const alvo = interaction.options.getUser('alvo');
        const summary = getPairSummary(interaction.user.id, alvo.id);

        const embed = criarEmbedPadrao('📊 Histórico de Interações')
            .setDescription('Estatísticas de carinho, socos e amizade entre **' + interaction.user.username + '** e **' + alvo.username + '**:\n\n' + summary)
            .setFooter({ text: 'Kensai Store Community', iconURL: interaction.user.displayAvatarURL() });

        await interaction.reply({ embeds: [embed] });
    }
};
