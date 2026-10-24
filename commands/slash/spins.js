const { 
    SlashCommandBuilder, 
    PermissionFlagsBits, 
    MessageFlags 
} = require('discord.js');
const { criarEmbedPadrao, criarEmbedSucesso, criarEmbedErro } = require('../../utils/embeds');
const { checkPermission, NO_PERMISSION_MSG } = require('../../utils/permissions');
const { 
    listarProdutosSpins, 
    formatarPrecoProduto, 
    adicionarProdutoSpins, 
    removerProdutoSpins, 
    atualizarPrecoSpins,
    moverPosicaoProdutoSpins,
    reordenarProdutosSpins
} = require('../../utils/spinsManager');
const { gerarPainelSpinsPassesPayload } = require('../../utils/ticketPanels');
const { setSpinsPassesConfig } = require('../../utils/ticketConfigs');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('spins')
        .setDescription('Gerencia os pacotes de spins e passes do painel oficial.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        // 1. Subcomando: Adicionar
        .addSubcommand(sub =>
            sub.setName('adicionar')
                .setDescription('Adiciona um novo pacote de spins ou passe ao catálogo.')
                .addStringOption(opt =>
                    opt.setName('nome')
                        .setDescription('Nome do item (ex: 2.000 Spins ou Passe VIP)')
                        .setRequired(true)
                )
                .addStringOption(opt =>
                    opt.setName('tipo')
                        .setDescription('Tipo do produto')
                        .setRequired(true)
                        .addChoices(
                            { name: '🌀 Pacote de Spins', value: 'spin' },
                            { name: '🎟️ Passe / Gamepass', value: 'passe' }
                        )
                )
                .addStringOption(opt =>
                    opt.setName('preco')
                        .setDescription('Preço do item em R$ (ex: 25.00 ou A Combinar)')
                        .setRequired(true)
                )
                .addStringOption(opt =>
                    opt.setName('emoji')
                        .setDescription('Emoji customizado (ex: 🌀 ou 🎟️)')
                        .setRequired(false)
                )
                .addStringOption(opt =>
                    opt.setName('descricao')
                        .setDescription('Descrição breve do pacote/passe')
                        .setRequired(false)
                )
        )
        // 2. Subcomando: Remover
        .addSubcommand(sub =>
            sub.setName('remover')
                .setDescription('Remove um item do catálogo do painel de spins e passes.')
                .addStringOption(opt =>
                    opt.setName('item')
                        .setDescription('Selecione o item para remover')
                        .setRequired(true)
                        .setAutocomplete(true)
                )
        )
        // 3. Subcomando: Preço
        .addSubcommand(sub =>
            sub.setName('preco')
                .setDescription('Atualiza o preço de venda de um item de spins ou passe.')
                .addStringOption(opt =>
                    opt.setName('item')
                        .setDescription('Selecione o item para alterar o valor')
                        .setRequired(true)
                        .setAutocomplete(true)
                )
                .addStringOption(opt =>
                    opt.setName('novo_preco')
                        .setDescription('Novo preço em R$ (ex: 22.50 ou A Combinar)')
                        .setRequired(true)
                )
        )
        // 4. Subcomando: Mover Posição
        .addSubcommand(sub =>
            sub.setName('mover')
                .setDescription('Move um item para uma posição específica (1, 2, 3...) no painel.')
                .addStringOption(opt =>
                    opt.setName('item')
                        .setDescription('Selecione o item para reposicionar')
                        .setRequired(true)
                        .setAutocomplete(true)
                )
                .addIntegerOption(opt =>
                    opt.setName('posicao')
                        .setDescription('Nova posição no painel (a partir de 1)')
                        .setMinValue(1)
                        .setRequired(true)
                )
        )
        // 5. Subcomando: Organizar Catálogo
        .addSubcommand(sub =>
            sub.setName('organizar')
                .setDescription('Reorganiza a ordem dos itens do painel por modo automático.')
                .addStringOption(opt =>
                    opt.setName('modo')
                        .setDescription('Critério de organização')
                        .setRequired(true)
                        .addChoices(
                            { name: '🌀 Spins Primeiro (depois Passes)', value: 'spins_primeiro' },
                            { name: '🎟️ Passes Primeiro (depois Spins)', value: 'passes_primeiro' },
                            { name: '📉 Menor Preço (Crescente)', value: 'menor_preco' },
                            { name: '📈 Maior Preço (Decrescente)', value: 'maior_preco' },
                            { name: '🔤 Ordem Alfabética (A-Z)', value: 'alfabetico' }
                        )
                )
        )
        // 6. Subcomando: Listar
        .addSubcommand(sub =>
            sub.setName('listar')
                .setDescription('Lista todos os pacotes de spins e passes ativos no catálogo.')
        )
        // 5. Subcomando: Painel
        .addSubcommand(sub =>
            sub.setName('painel')
                .setDescription('Envia o painel interativo de Spins e Passes neste canal.')
        ),

    async autocomplete(interaction) {
        const focused = interaction.options.getFocused().toLowerCase();
        const produtos = listarProdutosSpins();
        const filtrados = produtos.filter(p => 
            p.nome.toLowerCase().includes(focused) || p.id.toLowerCase().includes(focused)
        ).slice(0, 25);

        await interaction.respond(
            filtrados.map(p => ({
                name: (p.emoji || '') + ' ' + p.nome + ' (' + formatarPrecoProduto(p.preco) + ')',
                value: p.id
            }))
        );
    },

    async execute(interaction) {
        if (!checkPermission(interaction.member, PermissionFlagsBits.ManageGuild)) {
            return interaction.reply({ content: NO_PERMISSION_MSG, flags: [MessageFlags.Ephemeral] });
        }

        const sub = interaction.options.getSubcommand();

        if (sub === 'adicionar') {
            const nome = interaction.options.getString('nome');
            const tipo = interaction.options.getString('tipo');
            const preco = interaction.options.getString('preco');
            const emoji = interaction.options.getString('emoji');
            const descricao = interaction.options.getString('descricao');

            const novo = await adicionarProdutoSpins(interaction.guild, { nome, tipo, preco, emoji, descricao });
            const embed = criarEmbedSucesso('✅ Item Adicionado com Sucesso!',
                'O produto foi adicionado ao catálogo do painel de **Spins & Passes**:\n\n' +
                '• **Produto:** ' + (novo.emoji || '') + ' `' + novo.nome + '`\n' +
                '• **Tipo:** `' + (novo.tipo === 'spin' ? '🌀 Spin' : '🎟️ Passe') + '`\n' +
                '• **Preço:** `' + formatarPrecoProduto(novo.preco) + '`\n' +
                '• **Descrição:** ' + novo.descricao + '\n\n' +
                '🔄 *O painel público e dropdown de compra já foram sincronizados automaticamente.*'
            );
            return interaction.reply({ embeds: [embed], flags: [MessageFlags.Ephemeral] });
        }

        if (sub === 'remover') {
            const itemId = interaction.options.getString('item');
            const removido = await removerProdutoSpins(interaction.guild, itemId);
            if (!removido) {
                return interaction.reply({ content: '❌ Item não encontrado no catálogo.', flags: [MessageFlags.Ephemeral] });
            }
            const embed = criarEmbedSucesso('🗑️ Item Removido do Catálogo',
                'O item **' + removido.nome + '** foi excluído do catálogo de **Spins & Passes**.\n\n' +
                '🔄 *O painel público foi sincronizado na hora.*'
            );
            return interaction.reply({ embeds: [embed], flags: [MessageFlags.Ephemeral] });
        }

        if (sub === 'preco') {
            const itemId = interaction.options.getString('item');
            const novoPrecoRaw = interaction.options.getString('novo_preco');
            const atualizado = await atualizarPrecoSpins(interaction.guild, itemId, novoPrecoRaw);
            if (!atualizado) {
                return interaction.reply({ content: '❌ Item não encontrado.', flags: [MessageFlags.Ephemeral] });
            }
            const embed = criarEmbedSucesso('💵 Preço Atualizado!',
                'O valor comercial de **' + atualizado.nome + '** agora é: `' + formatarPrecoProduto(atualizado.preco) + '`\n\n' +
                '🔄 *O painel público foi sincronizado na hora.*'
            );
            return interaction.reply({ embeds: [embed], flags: [MessageFlags.Ephemeral] });
        }

        if (sub === 'mover') {
            const itemId = interaction.options.getString('item');
            const posicao = interaction.options.getInteger('posicao');
            const res = await moverPosicaoProdutoSpins(interaction.guild, itemId, posicao);
            if (!res) {
                return interaction.reply({ content: '❌ Item não encontrado no catálogo.', flags: [MessageFlags.Ephemeral] });
            }
            const embed = criarEmbedSucesso('🔃 Posição Atualizada!',
                'O item **' + res.produto.nome + '** foi movido com sucesso:\n\n' +
                '• **Posição Anterior:** #' + res.antigaPosicao + '\n' +
                '• **Nova Posição:** #' + res.novaPosicao + '\n\n' +
                '🔄 *O painel público e dropdown de compra já foram sincronizados automaticamente.*'
            );
            return interaction.reply({ embeds: [embed], flags: [MessageFlags.Ephemeral] });
        }

        if (sub === 'organizar') {
            const modo = interaction.options.getString('modo');
            const res = await reordenarProdutosSpins(interaction.guild, modo);
            const titulosModo = {
                'spins_primeiro': '🌀 Spins Primeiro, seguidos por Passes',
                'passes_primeiro': '🎟️ Passes Primeiro, seguidos por Spins',
                'menor_preco': '📉 Menor Preço (Crescente)',
                'maior_preco': '📈 Maior Preço (Decrescente)',
                'alfabetico': '🔤 Ordem Alfabética (A-Z)'
            };
            const embed = criarEmbedSucesso('🔃 Catálogo Reorganizado!',
                'A lista de produtos de Spins e Passes foi reorganizada com sucesso:\n\n' +
                '• **Modo Aplicado:** `' + (titulosModo[modo] || modo) + '`\n' +
                '• **Total de Itens:** `' + res.produtos.length + ' produtos`\n\n' +
                '🔄 *O painel público e o menu de seleção já foram atualizados em tempo real.*'
            );
            return interaction.reply({ embeds: [embed], flags: [MessageFlags.Ephemeral] });
        }

        if (sub === 'listar') {
            const produtos = listarProdutosSpins();
            const spins = produtos.filter(p => p.tipo === 'spin');
            const passes = produtos.filter(p => p.tipo === 'passe');

            const embed = criarEmbedPadrao('🌀 Catálogo Oficial • Spins & Passes')
                .setDescription('Confira abaixo todos os pacotes e passes atualmente cadastrados no painel:');

            if (spins.length > 0) {
                const list = spins.map(p => '• ' + (p.emoji || '🌀') + ' **' + p.nome + ':** `' + formatarPrecoProduto(p.preco) + '` (ID: `' + p.id + '`)').join('\n');
                embed.addFields({ name: '🌀 Pacotes de Spins (' + spins.length + ')', value: list, inline: false });
            }

            if (passes.length > 0) {
                const list = passes.map(p => '• ' + (p.emoji || '🎟️') + ' **' + p.nome + ':** `' + formatarPrecoProduto(p.preco) + '` (ID: `' + p.id + '`)').join('\n');
                embed.addFields({ name: '🎟️ Passes & Gamepasses (' + passes.length + ')', value: list, inline: false });
            }

            return interaction.reply({ embeds: [embed], flags: [MessageFlags.Ephemeral] });
        }

        if (sub === 'painel') {
            const payload = gerarPainelSpinsPassesPayload();
            const msg = await interaction.channel.send(payload);
            setSpinsPassesConfig({ canal_painel_id: interaction.channel.id, mensagem_painel_id: msg.id });
            return interaction.reply({ content: '🌀 **Painel de Spins & Passes** publicado com sucesso neste canal!', flags: [MessageFlags.Ephemeral] });
        }
    }
};
