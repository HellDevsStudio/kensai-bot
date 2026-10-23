const { 
    SlashCommandBuilder, 
    PermissionFlagsBits, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    MessageFlags 
} = require('discord.js');
const { checkPermission, NO_PERMISSION_MSG } = require('../../utils/permissions');
const {
    buscarCatalogoAutocomplete,
    buscarEstoqueAutocomplete,
    buscarItemCatalogo,
    armazenarPendenciaCadastro,
    obterPendenciaCadastro,
    removerPendenciaCadastro,
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
        // 1. Subcomando: Adicionar Item com 4 categorias, imagem automática do catálogo, upload próprio ou link
        .addSubcommand(sub =>
            sub.setName('adicionar')
                .setDescription('Adiciona item ao estoque com imagem do catálogo, upload próprio ou link.')
                .addStringOption(opt =>
                    opt.setName('nome')
                        .setDescription('Nome do item (digite para busca semântica no catálogo do Blade Ball)')
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
                        .setDescription('Selecione uma das 4 categorias da loja (ou deixe vazio para auto-detectar)')
                        .setRequired(false)
                        .addChoices(
                            { name: '⚔️ Espadas (Katanas e Skins)', value: 'Espada' },
                            { name: '🎭 Emotes (Animações)', value: 'Emote' },
                            { name: '💥 Explosões (Abates e Efeitos)', value: 'Explosão' },
                            { name: '⏳ Limitados (Packs e Sazonais)', value: 'Limitados' }
                        )
                )
                .addAttachmentOption(opt =>
                    opt.setName('imagem_arquivo')
                        .setDescription('Faça upload da imagem do item direto do seu dispositivo (opcional)')
                        .setRequired(false)
                )
                .addStringOption(opt =>
                    opt.setName('imagem_url')
                        .setDescription('Link/URL da imagem do item (opcional - se vazio, usa do catálogo)')
                        .setRequired(false)
                )
                .addStringOption(opt =>
                    opt.setName('imagem')
                        .setDescription('Alias para link de imagem (opcional)')
                        .setRequired(false)
                )
                .addBooleanOption(opt =>
                    opt.setName('auto_imagem')
                        .setDescription('Buscar imagem automaticamente do catálogo se disponível? (Padrão: Sim)')
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
                        .setDescription('Filtrar por uma das 4 categorias')
                        .setRequired(false)
                        .addChoices(
                            { name: '⚔️ Espadas', value: 'Espada' },
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

        // 1. ADICIONAR COM BUSCA SEMÂNTICA, IMAGEM (CATÁLOGO / UPLOAD / LINK), 4 CATEGORIAS E PRÉVIA
        if (sub === 'adicionar') {
            const nomeRaw = interaction.options.getString('nome');
            const precoRaw = interaction.options.getString('preco');
            const quantidade = interaction.options.getInteger('quantidade') ?? 1;
            const categoriaRaw = interaction.options.getString('categoria');
            const imagemArquivo = interaction.options.getAttachment('imagem_arquivo');
            const imagemUrl = interaction.options.getString('imagem_url') || interaction.options.getString('imagem');
            const autoImagem = interaction.options.getBoolean('auto_imagem') ?? true;
            const descricao = interaction.options.getString('descricao') || '';

            const precoLimpo = parseFloat(precoRaw.replace(/[^0-9,\.]/g, '').replace(',', '.'));
            if (isNaN(precoLimpo) || precoLimpo <= 0) {
                return interaction.reply({
                    content: '❌ Valor de preço inválido. Por favor, informe um número válido (ex: `18.50` ou `18,50`).',
                    flags: [MessageFlags.Ephemeral]
                });
            }

            // Realiza Busca Semântica no Catálogo Blade Ball Fandom
            const match = buscarItemCatalogo(nomeRaw, categoriaRaw);

            // Resolução da Categoria: escolha explícita do usuário > catálogo > Espada
            const categoriaFinal = categoriaRaw || (match ? match.categoria : 'Espada');

            // Resolução da Imagem (Upload de arquivo > Link externo > Catálogo automático se permitido)
            let imagemFinal = null;
            let origemImagem = '❌ Sem Imagem';

            if (imagemArquivo && imagemArquivo.url) {
                imagemFinal = imagemArquivo.url;
                origemImagem = '📁 Upload de Imagem Própria';
            } else if (imagemUrl && imagemUrl.trim()) {
                imagemFinal = imagemUrl.trim();
                origemImagem = '🌐 Link Externo Informado';
            } else if (autoImagem && match && match.imagem) {
                imagemFinal = match.imagem;
                origemImagem = '⛩️ Catálogo Oficial Blade Ball (Automático)';
            }

            // Nome final: se pertence ao catálogo e não for outra categoria, preserva nome canônico oficial
            const nomeFinal = (match && (!categoriaRaw || categoriaRaw === match.categoria)) 
                ? match.nome 
                : nomeRaw.trim();

            const precoStr = precoLimpo.toFixed(2).replace('.', ',');

            const emojiCategorias = {
                'Espada': '⚔️',
                'Emote': '🎭',
                'Explosão': '💥',
                'Limitados': '⏳'
            };
            const catEmoji = emojiCategorias[categoriaFinal] || '📦';

            const tempId = 'cad_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6);

            // Salva a pendência na memória
            armazenarPendenciaCadastro(tempId, {
                nome: nomeFinal,
                categoria: categoriaFinal,
                preco: precoLimpo,
                quantidade: quantidade,
                imagem: imagemFinal,
                descricao: descricao,
                userId: interaction.user.id
            });

            // Constrói o Card de Prévia no Estilo Kensai Store
            const embed = new EmbedBuilder()
                .setColor(config.EMBED_COLOR || 0x9a2ea6)
                .setAuthor({ 
                    name: '⛩️ KENSAI STORE • PRÉVIA DE CADASTRO NO ESTOQUE',
                    iconURL: interaction.guild?.iconURL({ dynamic: true }) || undefined
                })
                .setTitle(`${catEmoji} ${nomeFinal}`)
                .setDescription(
                    '> 🛡️ **Verifique os dados e a imagem abaixo antes de confirmar o cadastro no estoque:**\n\n' +
                    `• 🏷️ **Nome do Produto:** \`${nomeFinal}\`\n` +
                    `• 📦 **Categoria Oficial:** ${catEmoji} \`${categoriaFinal}\`\n` +
                    `• 💰 **Preço de Venda:** \`R$ ${precoStr}\`\n` +
                    `• 🔢 **Quantidade:** \`${quantidade} unidade(s)\`\n` +
                    `• 🖼️ **Origem da Imagem:** ${origemImagem}\n` +
                    (descricao ? `• 📝 **Descrição:** ${descricao}\n` : '') +
                    '──────────────────────────────────────────\n' +
                    '💡 *Clique em **Confirmar e Adicionar** para incluir este item na loja ou **Cancelar** para abortar.*'
                )
                .setFooter({ text: `Kensai Store • Categoria Oficial: ${categoriaFinal}` })
                .setTimestamp();

            if (imagemFinal) {
                embed.setImage(imagemFinal);
            }

            const rowBotoes = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`item_confirm_${tempId}`)
                    .setLabel('Confirmar e Adicionar')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('✅'),
                new ButtonBuilder()
                    .setCustomId(`item_cancel_${tempId}`)
                    .setLabel('Cancelar')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('❌')
            );

            return interaction.reply({
                embeds: [embed],
                components: [rowBotoes],
                flags: [MessageFlags.Ephemeral]
            });
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
                    name: `${c === 'Espada' ? '⚔️ Espadas' : c === 'Emote' ? '🎭 Emotes' : c === 'Limitados' ? '⏳ Limitados' : '💥 Explosões'} (${itensCat.length})`,
                    value: linhas.slice(0, 15).join('\n') + (linhas.length > 15 ? `\n*... e mais ${linhas.length - 15} itens.*`: ''),
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
    },

    /**
     * Handler dos botões de confirmação e cancelamento de cadastro de item
     */
    async handleButton(interaction) {
        if (!checkPermission(interaction.member, PermissionFlagsBits.ManageGuild)) {
            return interaction.reply({ content: NO_PERMISSION_MSG, flags: [MessageFlags.Ephemeral] });
        }

        const cid = interaction.customId;

        // A. CONFIRMAR CADASTRO
        if (cid.startsWith('item_confirm_')) {
            const tempId = cid.replace('item_confirm_', '');
            const pendencia = obterPendenciaCadastro(tempId);

            if (!pendencia) {
                return interaction.update({
                    content: '⚠️ Esta solicitação de cadastro expirou ou já foi processada.',
                    embeds: [],
                    components: []
                });
            }

            // Efetiva no estoque respeitando a categoria exata e imagem
            const res = adicionarItemEstoque(pendencia);
            removerPendenciaCadastro(tempId);

            const item = res.item;
            const precoStr = Number(item.preco).toFixed(2).replace('.', ',');

            const emojiCategorias = {
                'Espada': '⚔️',
                'Emote': '🎭',
                'Explosão': '💥',
                'Limitados': '⏳'
            };
            const catEmoji = emojiCategorias[item.categoria] || '📦';

            const embedSucesso = new EmbedBuilder()
                .setColor(0x22c55e)
                .setAuthor({ 
                    name: '⛩️ KENSAI STORE • ITEM ADICIONADO AO ESTOQUE',
                    iconURL: interaction.guild?.iconURL({ dynamic: true }) || undefined
                })
                .setTitle(`✅ ${item.nome} (${res.atualizado ? 'Estoque Abastecido' : 'Novo Produto'})`)
                .setDescription(
                    `O item **${item.nome}** foi salvo com sucesso no banco de dados e já está disponível para os clientes na categoria **${item.categoria}**!\n\n` +
                    `• 🏷️ **Nome Oficial:** \`${item.nome}\`\n` +
                    `• 📦 **Categoria:** ${catEmoji} \`${item.categoria}\`\n` +
                    `• 💰 **Preço:** \`R$ ${precoStr}\`\n` +
                    `• 🔢 **Estoque Total:** \`${item.quantidade} unidade(s)\`\n` +
                    `• 🆔 **Código ID:** \`${item.id}\`` +
                    (item.descricao ? `\n• 📝 **Descrição:** ${item.descricao}` : '')
                )
                .setFooter({ text: `Kensai Store • Cadastrado em ${item.categoria}` })
                .setTimestamp();

            if (item.imagem) {
                embedSucesso.setImage(item.imagem);
            }

            return interaction.update({
                embeds: [embedSucesso],
                components: []
            });
        }

        // B. CANCELAR CADASTRO
        if (cid.startsWith('item_cancel_')) {
            const tempId = cid.replace('item_cancel_', '');
            removerPendenciaCadastro(tempId);

            return interaction.update({
                content: '❌ **Cadastro cancelado.** Nenhum item ou quantidade foi adicionado ao estoque.',
                embeds: [],
                components: []
            });
        }
    }
};
