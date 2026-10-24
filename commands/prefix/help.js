const { ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const { criarEmbedPadrao } = require('../../utils/embeds');

module.exports = {
    name: 'help',
    description: 'Central de ajuda para membros e clientes da Kensai Store.',
    aliases: ['ajuda', 'comandos', 'menu'],
    async execute(message, args, client) {
        const embed = criarEmbedPadrao(
            '⛩️ Kensai Store — Central de Comandos',
            'Bem-vindo à central de comandos do **Ken Bot**!\n\n' +
            'Utilize o **Menu Dropdown** abaixo para navegar pelos comandos de membros e clientes.\n\n' +
            '• **Prefixo no chat:** `k!` (Ex: `k!ping`, `k!calc`, `k!avaliar`)\n' +
            '• **Membros da Staff:** Utilize `k!helpstaff` ou `/helpstaff` para os comandos de administração.'
        );

        const menu = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('help_category_select')
                .setPlaceholder('Escolha uma categoria de comandos...')
                .addOptions([
                    { label: 'Utilitários & Info', value: 'util', description: 'Informações, ping, perfil e canais', emoji: '🛠️' },
                    { label: 'Loja & Clientes', value: 'loja', description: 'Roblox, taxa e reputação', emoji: '🛒' },
                    { label: 'Diversão & Jogos', value: 'fun', description: 'Mini-games e brincadeiras no chat', emoji: '🎉' },
                    { label: 'Roleplay & Social', value: 'rp', description: 'Interações sociais entre membros', emoji: '🎭' }
                ])
        );

        return message.reply({ embeds: [embed], components: [menu] });
    }
};