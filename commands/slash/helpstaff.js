const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { criarEmbedPadrao } = require('../../utils/embeds');
const { isStaff, checkPermission } = require('../../utils/permissions');
const { getTokensConfig, getItensConfig, getSuporteConfig } = require('../../utils/ticketConfigs');

function ehStaffAutorizado(member) {
    if (!member) return false;
    if (member.permissions && (member.permissions.has(PermissionFlagsBits.Administrator) || member.permissions.has(PermissionFlagsBits.ManageMessages))) {
        return true;
    }
    if (isStaff(member) || checkPermission(member, PermissionFlagsBits.ManageMessages)) {
        return true;
    }
    const tok = getTokensConfig();
    const itn = getItensConfig();
    const sup = getSuporteConfig();
    const staffRoles = [tok.cargo_staff_id, itn.cargo_staff_id, sup.cargo_staff_id].filter(Boolean);
    return staffRoles.some(rId => member.roles?.cache?.has(rId));
}

const CATEGORIAS_STAFF = {
    vendas: {
        nome: '💳 Vendas, Finanças & Loja',
        descricao: 'Comandos de faturamento, cobranças Pix, avaliação de clientes e estoque.',
        comandos: [
            '`/pix [valor] [usuario]` (ou `k!pix`) - Gera cobrança Pix com QR Code oficial e botão de confirmação',
            '`/avaliar` (ou `k!avaliar`) - Envia painel com botão [Avalie Aqui] para o cliente do ticket avaliar',
            '`/painel-itens` - Envia o painel de seleção do Arsenal Kensai Store no canal configurado',
            '`/item adicionar` - Adiciona item com busca semântica, upload de imagem e categoria',
            '`/item listar` - Exibe a lista completa de itens cadastrados no estoque',
            '`/item remover [id]` - Remove um item do estoque oficial',
            '`/spins` (ou `k!spins`) - Gerencia pacotes de spins e passes (adicionar, remover, listar, preço)',
            '`/dm [usuario] [mensagem]` - Envia mensagem oficial da loja no privado (DM) do cliente'
        ]
    },
    adm: {
        nome: '⚙️ Administração & Configuração',
        descricao: 'Gerenciamento estrutural do servidor, canais e clonagem.',
        comandos: [
            '`/config` - Central interativa para configurar Suporte, Tokens e Arsenal',
            '`/copy` (ou `k!copy`) - Painel para clonar canais ou categorias mantendo permissões exatas',
            '`/lock` / `/unlock` - Tranca ou destranca o canal atual para membros comuns',
            '`/slowmode [segundos]` - Define o tempo de modo lento do canal',
            '`/nuke` - Limpa e reinicia o canal do zero com confirmação via botão',
            '`/role add/remove` - Adiciona ou remove cargos de membros',
            '`/setnick [membro] [apelido]` - Altera o apelido de um membro na guilda',
            '`/say [mensagem]` - Faz o Ken Bot enviar uma mensagem oficial no chat',
            '`/embed` - Construtor interativo de avisos em formato Embed via Modal',
            '`/sorteio` - Inicia sorteio com tempo, vencedores e prêmio configuráveis',
            '`/addemoji` - Adiciona um emoji ao servidor a partir de link ou imagem',
            '`/addsticker` - Adiciona uma figurinha ao servidor'
        ]
    },
    mod: {
        nome: '🛡️ Moderação & Punições',
        descricao: 'Controle disciplinar, limpeza de chat e histórico de advertências.',
        comandos: [
            '`/clear [quantidade]` - Limpa até 100 mensagens no canal',
            '`/ban [membro] [motivo]` - Bane um membro do servidor',
            '`/unban [id]` - Remove o banimento de um usuário pelo ID',
            '`/kick [membro] [motivo]` - Expulsa um membro da guilda',
            '`/timeout [membro] [tempo] [motivo]` - Aplica castigo (mute) temporário',
            '`/untimeout [membro]` - Remove o castigo de um membro',
            '`/warn [membro] [motivo]` - Aplica uma advertência formal salva no banco',
            '`/warnings [membro]` - Consulta a ficha e histórico de advertências do usuário',
            '`/unwarn [membro] [id]` - Remove uma advertência específica da ficha',
            '`/snipe` - Revela a última mensagem apagada no canal'
        ]
    }
};

function getHelpStaffMenu() {
    return new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('helpstaff_category_select')
            .setPlaceholder('Escolha uma categoria da Staff...')
            .addOptions([
                { label: 'Vendas & Finanças', value: 'vendas', description: 'Pix, avaliação, estoque e DM da loja', emoji: '💳' },
                { label: 'Administração & Servidor', value: 'adm', description: 'Config, clonagem, lock, nuke e anúncios', emoji: '⚙️' },
                { label: 'Moderação & Punições', value: 'mod', description: 'Clear, ban, kick, timeout e advertências', emoji: '🛡️' }
            ])
    );
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('helpstaff')
        .setDescription('Central de comandos administrativos exclusiva para a Staff da Kensai Store.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

    async execute(interaction) {
        if (!ehStaffAutorizado(interaction.member)) {
            return interaction.reply({
                content: '❌ **Acesso negado:** Este comando é exclusivo para membros da Staff da Kensai Store.',
                flags: [MessageFlags.Ephemeral]
            });
        }

        const embed = criarEmbedPadrao(
            '🛡️ Kensai Store — Central da Staff',
            'Bem-vindo ao manual operacional da **Equipe Kensai**!\n\n' +
            'Utilize o menu abaixo para navegar entre as ferramentas administrativas, financeiras e de moderação.\n\n' +
            '• **Prefixo para comandos no chat:** `k!` (Ex: `k!pix 15.50`, `k!avaliar`, `k!copy`, `k!clear 20`)'
        );

        return interaction.reply({
            embeds: [embed],
            components: [getHelpStaffMenu()],
            flags: [MessageFlags.Ephemeral]
        });
    },

    async handleSelect(interaction, category) {
        if (!ehStaffAutorizado(interaction.member)) {
            return interaction.reply({
                content: '❌ Apenas membros da Staff podem navegar neste menu.',
                flags: [MessageFlags.Ephemeral]
            });
        }

        const cat = CATEGORIAS_STAFF[category];
        if (!cat) return;

        const embed = criarEmbedPadrao(
            cat.nome,
            cat.descricao + '\n\n' + cat.comandos.join('\n')
        ).setFooter({ text: 'Kensai Store Staff • Confidencial e Administrativo' });

        return interaction.update({
            embeds: [embed],
            components: [getHelpStaffMenu()]
        });
    }
};