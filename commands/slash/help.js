const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const { criarEmbedPadrao } = require('../../utils/embeds');

const CATEGORIAS_CLIENTE = {
    util: {
        nome: '🛠️ Utilitários & Informações',
        descricao: 'Comandos gerais de consulta, perfil, informações e ferramentas.',
        comandos: [
            '`/ping` - Mede a latência e o tempo de atividade do bot',
            '`/help` - Abre esta central de ajuda para clientes',
            '`/serverinfo` - Exibe informações e dados da Kensai Store',
            '`/userinfo` - Mostra a ficha completa e cargos de um membro',
            '`/avatar` - Exibe a foto de perfil em alta definição',
            '`/banner` - Exibe o banner de perfil do usuário',
            '`/servericon` - Mostra o logo oficial do servidor',
            '`/roleinfo` - Detalhes e permissões de um cargo',
            '`/channelinfo` - Dados do canal de texto ou voz',
            '`/botinfo` - Ficha técnica e estatísticas do Ken Bot',
            '`/afk` - Ativa ou remove seu status de ausente',
            '`/lembrete` - Define um despertador ou lembrete pessoal',
            '`/calc` - Calculadora matemática rápida',
            '`/traduzir` - Tradutor automático de textos e termos',
            '`/sugerir` - Envia uma sugestão com sistema de votação'
        ]
    },
    loja: {
        nome: '🛒 Loja & Comunidade',
        descricao: 'Ferramentas comerciais e de atendimento para clientes da Kensai Store.',
        comandos: [
            '`/robloxinfo` - Consulta dados e perfil de contas no Roblox',
            '`/taxarobux` - Calcula o valor da Gamepass considerando os 30% do Roblox',
            '`/avaliar` - Abre o painel para avaliar o atendimento recebido',
            '`/reputacao` - Consulta as avaliações e nota de um vendedor da Staff',
            '`/vouch` - Envia uma confirmação rápida de entrega bem-sucedida'
        ]
    },
    fun: {
        nome: '🎉 Diversão & Mini-games',
        descricao: 'Jogos, interações e brincadeiras para interagir no chat.',
        comandos: [
            '`/8ball` - Pergunta para a bola 8 mística',
            '`/coinflip` - Gira uma moeda (Cara ou Coroa animado)',
            '`/roll` - Rola dados com faces customizadas',
            '`/ppt` - Joga Pedra, Papel e Tesoura contra o bot',
            '`/jogodavelha` - Desafia outro membro no Jogo da Velha 3x3',
            '`/duelo` - Duelo emocionante de lâminas e reflexos',
            '`/ship` - Calcula a compatibilidade entre dois membros',
            '`/hackear` - Simula uma invasão hacker divertida',
            '`/rate` - Dá uma nota bem-humorada de 0 a 100',
            '`/escolha` - Sorteia uma opção entre várias fornecidas',
            '`/ascii` - Converte seu texto em arte ASCII estilizada',
            '`/inverter` - Inverte as letras de uma frase'
        ]
    },
    rp: {
        nome: '🎭 Roleplay & Social',
        descricao: 'Ações de interação social e carinho entre amigos.',
        comandos: [
            '`/abracar` (ou `/hug`) - Dá um abraço quentinho com GIF',
            '`/beijar` (ou `/kiss`) - Dá um beijo afetuoso com GIF',
            '`/tapa` (ou `/slap`) - Dá uma bofetada cômica com GIF',
            '`/cafune` (ou `/pat`) - Faz cafuné na cabeça com GIF',
            '`/tocaaqui` (ou `/highfive`) - Manda um toca aqui / High Five com GIF'
        ]
    }
};

function getHelpClienteMenu() {
    return new ActionRowBuilder().addComponents(
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
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Central de ajuda com os comandos para clientes e comunidade da Kensai Store.'),
    
    async execute(interaction) {
        const embed = criarEmbedPadrao(
            '⛩️ Kensai Store — Central de Comandos',
            'Bem-vindo à central de comandos do **Ken Bot**!\n\n' +
            'Utilize o **Menu Dropdown** abaixo para explorar os comandos disponíveis para clientes e membros.\n\n' +
            '• **Prefixo para chat:** `k!` (Ex: `k!ping`, `k!calc`)\n' +
            '• **Membros da Staff:** Utilize `/helpstaff` para os comandos administrativos.'
        );

        return interaction.reply({
            embeds: [embed],
            components: [getHelpClienteMenu()]
        });
    },

    async handleSelect(interaction, category) {
        const cat = CATEGORIAS_CLIENTE[category];
        if (!cat) return;

        const embed = criarEmbedPadrao(
            cat.nome,
            cat.descricao + '\n\n' + cat.comandos.join('\n')
        ).setFooter({ text: 'Kensai Store • Use k! antes dos comandos no chat' });

        return interaction.update({
            embeds: [embed],
            components: [getHelpClienteMenu()]
        });
    }
};