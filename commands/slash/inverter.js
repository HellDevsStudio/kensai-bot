const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('inverter')
        .setDescription('Inverte a ordem das letras da frase com filtro anti-menções.')
        .addStringOption(opt => opt.setName('texto').setDescription('Texto a inverter').setRequired(true)),
    async execute(interaction) {
        const texto = interaction.options.getString('texto');
        // Filtro anti-mention: remove arrobas ou zero-width space
        const invertido = texto.split('').reverse().join('').replace(/@/g, '@​');

        await interaction.reply({
            content: `🙃 **Texto invertido:**\n> ${invertido}`,
            allowedMentions: { parse: [] }
        });
    }
};
