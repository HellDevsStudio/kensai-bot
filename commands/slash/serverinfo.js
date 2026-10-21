const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('serverinfo')
        .setDescription('Exibe informações e estatísticas deste servidor.'),

    async execute(interaction) {
        const guild = interaction.guild;
        const owner = await guild.fetchOwner().catch(() => null);

        const embed = new EmbedBuilder()
            .setColor(config.EMBED_COLOR)
            .setAuthor({ name: guild.name, iconURL: guild.iconURL({ dynamic: true }) })
            .setThumbnail(guild.iconURL({ dynamic: true, size: 256 }))
            .addFields(
                { name: '👑 Dono', value: owner ? `${owner.user.tag} (\`${owner.id}\`)` : 'Não identificado', inline: true },
                { name: '🆔 ID do Servidor', value: `\`${guild.id}\``, inline: true },
                { name: '📅 Criado em', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:D>`, inline: true },
                { name: '👥 Total de Membros', value: `\`${guild.memberCount}\``, inline: true },
                { name: '💬 Total de Canais', value: `\`${guild.channels.cache.size}\``, inline: true },
                { name: '🚀 Nível de Impulso', value: `Nível ${guild.premiumTier} (${guild.premiumSubscriptionCount} impulsos)`, inline: true }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
