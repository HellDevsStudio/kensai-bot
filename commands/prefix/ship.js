const { criarEmbedPadrao, criarEmbedErro } = require('../../utils/embeds');

module.exports = {
    name: 'ship',
    description: 'Calcula o ship entre dois usuários.',
    async execute(message, args) {
        const mentions = Array.from(message.mentions.users.values());
        const u1 = mentions[0] || message.author;
        const u2 = mentions[1] || message.author;

        const ids = [u1.id, u2.id].sort().join('');
        let hash = 0;
        for (let i = 0; i < ids.length; i++) hash = (hash << 5) - hash + ids.charCodeAt(i);
        const pct = Math.abs(hash) % 101;

        const progressBar = '🟪'.repeat(Math.round(pct / 10)) + '⬜'.repeat(10 - Math.round(pct / 10));
        const embed = criarEmbedPadrao('💘 Medidor de Química')
            .addFields(
                { name: '👥 Casal', value: `<@${u1.id}> + <@${u2.id}>`, inline: true },
                { name: '📊 Afinidade', value: `**${pct}%**`, inline: true },
                { name: 'Barra', value: progressBar }
            );

        await message.reply({ embeds: [embed] });
    }
};
