const { PermissionFlagsBits } = require('discord.js');
const { checkPermission, NO_PERMISSION_MSG } = require('../../utils/permissions');
const { 
    listarProdutosSpins, 
    formatarPrecoProduto, 
    adicionarProdutoSpins, 
    removerProdutoSpins 
} = require('../../utils/spinsManager');
const { gerarPainelSpinsPassesPayload } = require('../../utils/ticketPanels');
const { setSpinsPassesConfig } = require('../../utils/ticketConfigs');
const { criarEmbedPadrao, criarEmbedSucesso, criarEmbedErro } = require('../../utils/embeds');

module.exports = {
    name: 'spins',
    description: 'Gerencia o catálogo e painel de spins e passes da loja.',
    async execute(message, args) {
        if (!checkPermission(message.member, PermissionFlagsBits.ManageGuild)) {
            return message.reply(NO_PERMISSION_MSG);
        }

        const sub = (args[0] || 'listar').toLowerCase();

        if (sub === 'painel') {
            const payload = gerarPainelSpinsPassesPayload();
            const msg = await message.channel.send(payload);
            setSpinsPassesConfig({ canal_painel_id: message.channel.id, mensagem_painel_id: msg.id });
            return message.reply('🌀 **Painel de Spins & Passes** enviado com sucesso neste canal!');
        }

        if (sub === 'listar') {
            const produtos = listarProdutosSpins();
            const spins = produtos.filter(p => p.tipo === 'spin');
            const passes = produtos.filter(p => p.tipo === 'passe');

            const embed = criarEmbedPadrao('🌀 Catálogo Oficial • Spins & Passes')
                .setDescription('Confira todos os itens ativos no painel de Spins & Passes:');

            if (spins.length > 0) {
                const list = spins.map(p => '• ' + (p.emoji || '🌀') + ' **' + p.nome + ':** `' + formatarPrecoProduto(p.preco) + '`').join('\n');
                embed.addFields({ name: '🌀 Pacotes de Spins (' + spins.length + ')', value: list, inline: false });
            }

            if (passes.length > 0) {
                const list = passes.map(p => '• ' + (p.emoji || '🎟️') + ' **' + p.nome + ':** `' + formatarPrecoProduto(p.preco) + '`').join('\n');
                embed.addFields({ name: '🎟️ Passes & Gamepasses (' + passes.length + ')', value: list, inline: false });
            }

            return message.reply({ embeds: [embed] });
        }

        return message.reply('💡 Uso do comando: `k!spins listar` | `k!spins painel` ou gerencie tudo visualmente via `/config`!');
    }
};
