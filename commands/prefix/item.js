const { PermissionsBitField, EmbedBuilder } = require('discord.js');
const { checkPermission, NO_PERMISSION_MSG } = require('../../utils/permissions');
const {
    adicionarItemEstoque,
    removerItemEstoque,
    atualizarQuantidadeEstoque,
    atualizarPrecoEstoque
} = require('../../utils/itemManager');
const { lerEstoque } = require('../../utils/itemControl');
const { gerarPainelItensPayload } = require('../../utils/renderItensPanel');
const config = require('../../config');

module.exports = {
    name: 'item',
    description: 'Gerencia o estoque de itens da Kensai Store via prefixo.',
    aliases: ['itens', 'estoque', 'sword'],
    async execute(message, args) {
        if (!checkPermission(message.member, PermissionsBitField.Flags.ManageGuild)) {
            return message.reply(NO_PERMISSION_MSG);
        }

        const sub = (args[0] || 'ajuda').toLowerCase();

        // k!item painel
        if (sub === 'painel') {
            const payload = gerarPainelItensPayload(message.guild);
            await message.channel.send(payload);
            if (message.deletable) await message.delete().catch(() => {});
            return;
        }

        // k!item listar [categoria]
        if (sub === 'listar' || sub === 'lista') {
            const catFiltro = args[1] ? args[1].toLowerCase() : null;
            const estoque = lerEstoque();
            const itens = catFiltro ? estoque.filter(i => i.categoria.toLowerCase() === catFiltro) : estoque;

            if (itens.length === 0) {
                return message.reply('📦 Nenhum item encontrado no estoque.');
            }

            const embed = new EmbedBuilder()
                .setColor(config.EMBED_COLOR || 0x9a2ea6)
                .setTitle(`📦 Estoque Oficial (${itens.length} itens cadastrados)`)
                .setDescription(
                    itens.slice(0, 20).map(i => {
                        const preco = Number(i.preco).toFixed(2).replace('.', ',');
                        return `• [${i.categoria}] **${i.nome}** ➔ \`R$ ${preco}\` (Estoque: \`${i.quantidade}\` | ID: \`${i.id}\`)`;
                    }).join('\n')
                )
                .setFooter({ text: 'Use /item ou k!item para gerenciar' });

            return message.reply({ embeds: [embed] });
        }

        // k!item add <nome> <preco> [qtd] [categoria]
        if (sub === 'add' || sub === 'adicionar') {
            if (args.length < 3) {
                return message.reply('❌ Formato: `k!item add <Nome do Item> <Preço R$> [Quantidade] [Categoria]`\nExemplo: `k!item add Samurai Katana 15.50 2 Espada`\n💡 *Você também pode anexar uma imagem à mensagem para salvar como imagem própria!*');
            }

            const lastArg = args[args.length - 1];
            const secondLastArg = args[args.length - 2];

            let categoria = 'Espada';
            let quantidade = 1;
            let precoStr = '';
            let nomeArgs = [];

            const mapCats = {
                'espada': 'Espada',
                'espadas': 'Espada',
                'katana': 'Espada',
                'emote': 'Emote',
                'emotes': 'Emote',
                'explosão': 'Explosão',
                'explosao': 'Explosão',
                'explosoes': 'Explosão',
                'limitados': 'Limitados',
                'limitado': 'Limitados',
                'pack': 'Limitados',
                'packs': 'Limitados'
            };

            if (mapCats[lastArg.toLowerCase()]) {
                categoria = mapCats[lastArg.toLowerCase()];
                quantidade = parseInt(secondLastArg, 10) || 1;
                precoStr = args[args.length - 3];
                nomeArgs = args.slice(1, args.length - 3);
            } else if (!isNaN(parseInt(lastArg, 10))) {
                quantidade = parseInt(lastArg, 10);
                precoStr = secondLastArg;
                nomeArgs = args.slice(1, args.length - 2);
            } else {
                precoStr = lastArg;
                nomeArgs = args.slice(1, args.length - 1);
            }

            const nome = nomeArgs.join(' ');
            if (!nome || !precoStr) {
                return message.reply('❌ Nome e preço são obrigatórios!');
            }

            // Suporte a imagem via anexo na mensagem do Discord
            let imagem = null;
            if (message.attachments && message.attachments.size > 0) {
                imagem = message.attachments.first().url;
            }

            const res = adicionarItemEstoque({ nome, categoria, preco: precoStr, quantidade, imagem });
            const precoFormatado = Number(res.item.preco).toFixed(2).replace('.', ',');

            const embed = new EmbedBuilder()
                .setColor(config.EMBED_COLOR || 0x9a2ea6)
                .setTitle(`✅ Item ${res.atualizado ? 'Atualizado' : 'Adicionado'} ao Estoque!`)
                .setDescription(
                    `• 🏷️ **Nome:** \`${res.item.nome}\`\n` +
                    `• 📦 **Categoria:** \`${res.item.categoria}\`\n` +
                    `• 💰 **Preço:** \`R$ ${precoFormatado}\`\n` +
                    `• 🔢 **Quantidade:** \`${res.item.quantidade}\`\n` +
                    `• 🆔 **ID:** \`${res.item.id}\`` +
                    (res.item.imagem ? `\n• 🖼️ **Imagem:** [Visualizar](${res.item.imagem})` : '')
                );

            if (res.item.imagem) {
                embed.setThumbnail(res.item.imagem);
            }

            return message.reply({ embeds: [embed] });
        }

        // k!item del <idOuNome>
        if (sub === 'del' || sub === 'remover') {
            const termo = args.slice(1).join(' ');
            if (!termo) return message.reply('❌ Informe o ID ou nome do item para remover.');
            const res = removerItemEstoque(termo);
            if (!res.removido) return message.reply('❌ Item não encontrado no estoque.');
            return message.reply(`🗑️ Item **${res.item.nome}** removido do estoque!`);
        }

        // k!item estoque <idOuNome> <quantidade>
        if (sub === 'estoque' || sub === 'qtd') {
            const qtd = parseInt(args[args.length - 1], 10);
            const termo = args.slice(1, args.length - 1).join(' ');
            if (isNaN(qtd) || !termo) return message.reply('❌ Formato: `k!item estoque <Nome ou ID> <Nova Quantidade>`');
            const res = atualizarQuantidadeEstoque(termo, qtd);
            if (!res.atualizado) return message.reply('❌ Item não encontrado no estoque.');
            return message.reply(`✅ Estoque de **${res.item.nome}** atualizado para **${res.item.quantidade} unidade(s)**!`);
        }

        // k!item preco <idOuNome> <novoPreco>
        if (sub === 'preco' || sub === 'valor') {
            const precoStr = args[args.length - 1];
            const termo = args.slice(1, args.length - 1).join(' ');
            if (!precoStr || !termo) return message.reply('❌ Formato: `k!item preco <Nome ou ID> <Novo Preço>`');
            const res = atualizarPrecoEstoque(termo, precoStr);
            if (!res.atualizado) return message.reply('❌ Item não encontrado ou preço inválido.');
            return message.reply(`✅ Preço de **${res.item.nome}** atualizado para **R$ ${Number(res.item.preco).toFixed(2).replace('.', ',')}**!`);
        }

        // Ajuda
        return message.reply(
            '📖 **Comandos do Arsenal & Estoque:**\n' +
            '• `k!item painel` ➔ Envia o painel de itens no canal\n' +
            '• `k!item listar [categoria]` ➔ Mostra todos os itens cadastrados\n' +
            '• `k!item add <nome> <preco> [qtd] [categoria]` ➔ Adiciona item\n' +
            '• `k!item del <nome/id>` ➔ Remove item\n' +
            '• `k!item estoque <nome/id> <qtd>` ➔ Altera quantidade\n' +
            '• `k!item preco <nome/id> <valor>` ➔ Altera preço'
        );
    }
};
