const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('escolha')
        .setDescription('Ajuda indecisos sorteando uma das opções separadas por vírgula.')
        .addStringOption(opt => opt.setName('opcoes').setDescription('Opções separadas por vírgula (ex: Pizza, Hambúrguer, Sushi)').setRequired(true)),
    async execute(interaction) {
        const raw = interaction.options.getString('opcoes');
        const opts = raw.split(',').map(o => o.trim()).filter(o => o.length > 0);

        if (opts.length < 2) {
            return interaction.reply({ content: '❌ Forneça pelo menos 2 opções separadas por vírgula!', ephemeral: true });
        }

        const sorteado = opts[Math.floor(Math.random() * opts.length)];
        await interaction.reply(`🤔 Entre essas opções, o **Ken** escolhe com certeza: **${sorteado}**!`);
    }
};
