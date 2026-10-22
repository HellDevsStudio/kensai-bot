const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, MessageFlags } = require('discord.js');
const { checkPermission, NO_PERMISSION_MSG } = require('../../utils/permissions');
const {
    buscarCatalogoAutocomplete,
    buscarEstoqueAutocomplete,
    adicionarItemEstoque,
    removerItemEstoque,
    atualizarQuantidadeEstoque,
    atualizarPrecoEstoque
} = require('../../utils/itemManager');
const { lerEstoque } = require('../../utils/itemControl');
const { gerarPainelItensPayload } = require('../../utils/renderItensPanel');
const config = require('../../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('item')
        .setDescription('Gerencia os itens do arsenal e estoque da Kensai Store.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        // 1. Subcomando: Adicionar Item
        .addSubcommand(sub =>
            sub.setName('adicionar')
                .setDescription('Adiciona ou abastece um item no estoque da loja.')
                .addStringOption(opt =>
                    opt.setName('nome')
                        .setDescription('Nome do item (digite para autocompletar do catálogo do Blade Ball)')
                        .setRequired(true)
                        .setAutocomplete(true)
                )
                .addStringOption(opt =>
                    opt.setName('preco')
                        .setDescription('Preço de venda em R$ (ex: 25.50 ou 25,00)')
                        .setRequired(true)
                )
                .addIntegerOption(opt =>
                    opt.setName('quantidade')
                        .setDescription('Quantidade inicial disponível em estoque (padrão: 1)')
                        .setRequired(false)
                        .setMinValue(0)
                )
                .addStringOption(opt =>
                    opt.setName('categoria')
                        .setDescription('Categoria do item (auto-detectada se for do catálogo)')
                        .setRequired(false)
                        .addChoices(
                            { name: '🗡️ Espada', value: 'Espada' },
                            { name: '🎭 Emote', value: 'Emote' },
                            { name: '💥 Explosão', value: 'Explosão' },
                            { name: '⏳ Limitados (Packs)', value: 'Limitados' }
                        )
                )
                .addStringOption(opt =>
                    opt.setName('imagem')
                        .setDescription('URL da imagem do item (preenchida automaticamente se do catálogo)')
                        .setRequired(false)
                )
                .addStringOption(opt =>
                    opt.setName('descricao')
                        .setDescription('Descrição opcional do item')
                        .setRequired(false)
                )
        )
        // 2. Subcomando: Atualizar Estoque
        .addSubcommand(sub =>
            sub.setName('estoque')
                .setDescription('Altera a quantidade em estoque de um item existente.')
                .addStringOption(opt =>
                    opt.setName('item')
                        .setDescription('Item cadastrado no estoque')
                        .setRequired(true)
                        .setAutocomplete(true)
                )
                .addIntegerOption(opt =>
                    opt.setName('quantidade')
                        .setDescription('Nova quantidade em estoque')
                        .setRequired(true)
                        .setMinValue(0)
                )
        )
        // 3. Subcomando: Atualizar Preço
        .addSubcommand(sub =>
            sub.setName('preco')
                .setDescription('Altera o preço de venda de um item do estoque.')
                .addStringOption(opt =>
                    opt.setName('item')
                        .setDescription('Item cadastrado no estoque')
                        .setRequired(true)
                        .setAutocomplete(true)
                )
                .addStringOption(opt =>
                    opt.setName('valor')
                        .setDescription('Novo preço em R$ (ex: 30.00 ou 30,00)')
                        .setRequired(true)
                )
        )
        // 4. Subcomando: Remover Item
        .addSubcommand(sub =>
            sub.setName('remover')
                .setDescription('Remove um item do estoque da loja.')
                .addStringOption(opt =>
                    opt.setName('item')
                        .setDescription('Item a ser excluído do estoque')
                        .setRequired(true)
                        .setAutocomplete(true)
                )
        )
        // 5. Subcomando: Listar Estoque
        .addSubcommand(sub =>
            sub.setName('listar')
                .setDescription('Lista todos os itens cadastrados no estoque da Kensai Store.')
                .addStringOption(opt =>
                    opt.setName('categoria')
                        .setDescription('Filtrar por categoria específica')
                        .setRequired(false)
                        .addChoices(
                            { name: '🗡️ Espadas', value: 'Espada' },
                            { name: '🎭 Emotes', value: 'Emote' },
                            { name: '💥 Explosões', value: 'Explosão' },
                            { name: '⏳ Limitados', value: 'Limitados' }
                        )
                )
        )
        // 6. Subcomando: Postar Painel
        .addSubcommand(sub =>
            sub.setName('painel')
                .setDescription('Envia o painel oficial de itens no canal atual.')
        ),

    async autocomplete(interaction) {
        const focused = interaction.options.getFocused(true);
        if (focused.name === 'nome') {
            const escolhas = buscarCatalogoAutocomplete(focused.value);
            return interaction.respond(escolhas).catch(() => {});
        }
        if (focused.name === 'item') {
            const escolhas = buscarEstoqueAutocomplete(focused.value);
            return interaction.respond(escolhas).catch(() => {});
        }
    },

    async execute(interaction) {
        if (!checkPermission(interaction.member, PermissionFlagsBits.ManageGuild)) {
            return interaction.reply({ content: NO_PERMISSION_MSG, flags: [MessageFlags.Ephemeral] });
        }

        const sub = interaction.options.getSubcommand();

        // 1. ADICIONAR
        if (sub === 'adicionar') {
            const nome = interaction.options.getString('nome');
            const preco = interaction.options.getString('preco');
            const quantidade = interaction.options.getInteger('quantidade') ?? 1;
            const categoria = interaction.options.getString('categoria');
            const imagem = interaction.options.getString('imagem');
            const descricao = interaction.options.getString('descricao');

            const res = adicionarItemEstoque({ nome, categoria, preco, quantidade, imagem, descricao });
            const item = res.item;
            const precoStr = Number(item.preco).toFixed(2).replace('.', ',');

            const embed = new EmbedBuilder()
                .setColor(config.EMBED_COLOR || 0x9a2ea6)
                .setTitle(res.atualizado ? '🔄 Item Atualizado no Estoque!' : '✅ Novo Item Adicionado ao Estoque!')
                .setDescription(
                    `• 🏷️ **Nome:** \`${item.nome}\`\n` +
                    `• 📦 **Categoria:** \`${item.categoria}\`\n` +
                    `• 💰 **Preço:** \`R$ ${precoStr}\`\n` +
                    `• 🔢 **Quantidade:** \`${item.quantidade} unidade(s)\`\n` +
                    `• 🆔 **ID:** \`${item.id}\`` +
                    (item.descricao ? `\n• 📝 **Descrição:** ${item.descricao}` : '')
                )
                .setTimestamp();

            if (item.imagem) {
                embed.setThumbnail(item.imagem);
            }

            return interaction.reply({ embeds: [embed], flags: [MessageFlags.Ephemeral] });
        }

        // 2. ESTOQUE
        if (sub === 'estoque') {
            const idOuNome = interaction.options.getString('item');
            const qtd = interaction.options.getInteger('quantidade');
            const res = atualizarQuantidadeEstoque(idOuNome, qtd);

            if (!res.atualizado) {
                return interaction.reply({ content: '❌ Item não encontrado no estoque.', flags: [MessageFlags.Ephemeral] });
            }

            return interaction.reply({
                content: `✅ Estoque de **${res.item.nome}** atualizado para **${res.item.quantidade} unidade(s)**!`,
                flags: [MessageFlags.Ephemeral]
            });
        }

        // 3. PREÇO
        if (sub === 'preco') {
            const idOuNome = interaction.options.getString('item');
            const preco = interaction.options.getString('valor');
            const res = atualizarPrecoEstoque(idOuNome, preco);

            if (!res.atualizado) {
                return interaction.reply({ content: '❌ Item não encontrado ou preço inválido.', flags: [MessageFlags.Ephemeral] });
            }

            const precoStr = Number(res.item.preco).toFixed(2).replace('.', ',');
            return interaction.reply({
                content: `✅ Preço de **${res.item.nome}** atualizado para **R$ ${precoStr}**!`,
                flags: [MessageFlags.Ephemeral]
            });
        }

        // 4. REMOVER
        if (sub === 'remover') {
            const idOuNome = interaction.options.getString('item');
            const res = removerItemEstoque(idOuNome);

            if (!res.removido) {
                return interaction.reply({ content: '❌ Item não encontrado no estoque.', flags: [MessageFlags.Ephemeral] });
            }

            return interaction.reply({
                content: `🗑️ Item **${res.item.nome}** (ID: \`${res.item.id}\`) foi removido do estoque!`,
                flags: [MessageFlags.Ephemeral]
            });
        }

        // 5. LISTAR
        if (sub === 'listar') {
            const catFiltro = interaction.options.getString('categoria');
            const estoque = lerEstoque();
            const itens = catFiltro ? estoque.filter(i => i.categoria === catFiltro) : estoque;

            if (itens.length === 0) {
                return interaction.reply({
                    content: `📦 Nenhum item encontrado no estoque${catFiltro ? ` na categoria **${catFiltro}**` : ''}.`,
                    flags: [MessageFlags.Ephemeral]
                });
            }

            const categorias = ['Espada', 'Emote', 'Explosão', 'Limitados'];
            const embed = new EmbedBuilder()
                .setColor(config.EMBED_COLOR || 0x9a2ea6)
                .setTitle(`📦 Estoque Oficial • Kensai Store (${itens.length} itens cadastrados)`)
                .setTimestamp();

            for (const c of categorias) {
                const itensCat = itens.filter(i => i.categoria === c);
                if (itensCat.length === 0) continue;

                const linhas = itensCat.map(i => {
                    const preco = Number(i.preco).toFixed(2).replace('.', ',');
                    return `• **${i.nome}** ➔ \`R$ ${preco}\` | Est: \`${i.quantidade}\` | ID: \`${i.id}\``;
                });

                embed.addFields({
                    name: `${c === 'Espada' ? '🗡️ Espadas' : c === 'Emote' ? '🎭 Emotes' : c === 'Limitados' ? '⏳ Limitados' : '💥 Explosões'} (${itensCat.length})`,
                    value: linhas.slice(0, 15).join('\n') + (linhas.length > 15 ? `\n*... e mais ${linhas.length - 15} itens.*` : ''),
                    inline: false
                });
            }

            return interaction.reply({ embeds: [embed], flags: [MessageFlags.Ephemeral] });
        }

        // 6. PAINEL
        if (sub === 'painel') {
            await interaction.deferReply({ flags: [MessageFlags.Ephemeral] }).catch(() => {});
            const payload = gerarPainelItensPayload(interaction.guild);
            await interaction.channel.send(payload);
            return interaction.editReply({ content: '✅ Painel de itens enviado com sucesso neste canal!' });
        }
    }
};
