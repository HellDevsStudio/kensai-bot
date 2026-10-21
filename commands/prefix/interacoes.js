const { criarEmbedPadrao, criarEmbedErro } = require('../../utils/embeds');
const { getPairSummary } = require('../../utils/roleplay');

module.exports = {
    name: 'interacoes',
    aliases: ['historico', 'socialstats', 'interacoesstats'],
    description: 'Exibe o contador de interações e carinhos entre dois membros.',
    async execute(message, args) {
        const alvo = message.mentions.users.first();
        if (!alvo) {
            return message.reply({
                embeds: [criarEmbedErro('Uso Correto', 'Mencione um membro: `k!interacoes @usuario`')]
            });
        }

        const summary = getPairSummary(message.author.id, alvo.id);

        const embed = criarEmbedPadrao('📊 Histórico de Interações')
            .setDescription('Estatísticas de carinho, socos e amizade entre **' + message.author.username + '** e **' + alvo.username + '**:\n\n' + summary)
            .setFooter({ text: 'Kensai Store Community', iconURL: message.author.displayAvatarURL() });

        await message.reply({ embeds: [embed] });
    }
};
