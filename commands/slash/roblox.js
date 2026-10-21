const { SlashCommandBuilder } = require('discord.js');
const { criarEmbedPadrao, criarEmbedErro } = require('../../utils/embeds');
const { getRobloxUser } = require('../../utils/roblox');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('robloxinfo')
        .setDescription('Consulta os dados oficiais de uma conta no Roblox.')
        .addStringOption(opt => opt.setName('usuario').setDescription('Nome de usuário no Roblox').setRequired(true)),
    async execute(interaction) {
        const username = interaction.options.getString('usuario');
        await interaction.deferReply();

        const user = await getRobloxUser(username);
        if (!user) {
            return interaction.editReply({
                embeds: [criarEmbedErro('Conta Não Encontrada', `Não foi possível localizar o usuário **${username}** no Roblox.`)]
            });
        }

        const embed = criarEmbedPadrao(`🎮 Perfil Roblox: ${user.displayName}`)
            .addFields(
                { name: '👤 Nome de Exibição', value: user.displayName, inline: true },
                { name: '🏷️ @Username', value: `@${user.name}`, inline: true },
                { name: '🆔 ID Roblox', value: `\`${user.id}\``, inline: true },
                { name: '📅 Criado em', value: user.created ? new Date(user.created).toLocaleDateString('pt-BR') : 'Desconhecido', inline: true },
                { name: '🛡️ Verificado?', value: user.hasVerifiedBadge ? 'Sim ✅' : 'Não', inline: true },
                { name: '🔗 Perfil Oficial', value: `[Ver no Roblox](${user.profileUrl})`, inline: true }
            );

        if (user.avatarUrl) {
            embed.setThumbnail(user.avatarUrl);
        }

        await interaction.editReply({ embeds: [embed] });
    }
};
