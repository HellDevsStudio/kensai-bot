const slashHelp = require('../slash/help');

module.exports = {
    name: 'help',
    description: 'Central de ajuda do bot.',
    async execute(message, args, client) {
        const { criarEmbedPadrao } = require('../../utils/embeds');
        const embed = criarEmbedPadrao(
            '🗡️ Kensai Store — Central de Comandos',
            'Bem-vindo à central de ajuda do **Ken**!\n\n' +
            'Utilize o **Menu Dropdown** abaixo para navegar entre as categorias disponíveis.\n' +
            'Você também pode usar `/help` para a versão Slash Command.'
        );
        const { ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
        const menu = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('help_category_select')
                .setPlaceholder('Selecione uma categoria...')
                .addOptions([
                    { label: 'Utilitários', value: 'util', description: 'Comandos de informações e ping', emoji: '🛠️' },
                    { label: 'Loja & Clientes', value: 'loja', description: 'Roblox, taxa de robux e avaliações', emoji: '🛒' },
                    { label: 'Diversão & Jogos', value: 'fun', description: 'Mini-games e brincadeiras', emoji: '🎉' },
                    { label: 'Roleplay', value: 'rp', description: 'Interações sociais', emoji: '🎭' },
                    { label: 'Staff & Moderação', value: 'staff', description: 'Comandos restritos', emoji: '🛡️' }
                ])
        );

        await message.reply({ embeds: [embed], components: [menu] });
    }
};
