const { criarEmbedPadrao, criarEmbedErro } = require('../../utils/embeds');
const { getRobloxUser } = require('../../utils/roblox');

module.exports = {
    name: 'roblox',
    description: 'Consulta uma conta no Roblox.',
    async execute(message, args) {
        const username = args[0];
        if (!username) {
            return message.reply({ embeds: [criarEmbedErro('Uso Correto', 'Use: `k!roblox [nick]`')] });
        }

        const waitMsg = await message.reply('🔍 Consultando API do Roblox...');
        const user = await getRobloxUser(username);
        if (!user) {
            return waitMsg.edit({
                content: null,
                embeds: [criarEmbedErro('Conta Não Encontrada', `Não foi possível localizar o usuário **${username}** no Roblox.`)]
            });
        }

        const embed = criarEmbedPadrao(`🎮 Perfil Roblox: ${user.displayName}`)
            .addFields(
                { name: '👤 Nome de Exibição', value: user.displayName, inline: true },
                { name: '🏷️ @Username', value: `@${user.name}`, inline: true },
                { name: '🆔 ID Roblox', value: `\`${user.id}\``, inline: true },
                { name: '📅 Criado em', value: user.created ? new Date(user.created).toLocaleDateString('pt-BR') : 'Desconhecido', inline: true },
                { name: '🔗 Perfil', value: `[Ver no Roblox](${user.profileUrl})`, inline: true }
            );

        if (user.avatarUrl) {
            embed.setThumbnail(user.avatarUrl);
        }

        await waitMsg.edit({ content: null, embeds: [embed] });
    }
};
