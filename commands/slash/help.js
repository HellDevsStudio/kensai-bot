const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const { criarEmbedPadrao } = require('../../utils/embeds');

const CATEGORIAS = {
    util: {
        nome: '🛠️ Utilitários e Informações',
        descricao: 'Comandos gerais de consulta, ping, perfil e canais.',
        comandos: [
            '`/ping` - Mede latência e uptime',
            '`/help` - Menu de ajuda',
            '`/serverinfo` - Dados da Kensai Store',
            '`/userinfo` - Ficha do membro',
            '`/avatar` - Imagem de perfil',
            '`/banner` - Capa de perfil',
            '`/servericon` - Logo do servidor',
            '`/roleinfo` - Detalhes do cargo',
            '`/channelinfo` - Dados do canal',
            '`/botinfo` - Ficha técnica do Ken',
            '`/afk` - Ativa modo ausente',
            '`/lembrete` - Despertador/lembrete',
            '`/calc` - Calculadora matemática',
            '`/traduzir` - Tradutor de idiomas',
            '`/sugerir` - Envia sugestão com votação'
        ]
    },
    loja: {
        nome: '🛒 Loja & Comunidade',
        descricao: 'Ferramentas comerciais para clientes da Kensai Store.',
        comandos: [
            '`/robloxinfo` - Consulta conta do Roblox',
            '`/taxarobux` - Calcula os 30% da Gamepass',
            '`/avaliar` - Avalia o atendimento com estrelas',
            '`/reputacao` - Consulta reputação de vendedor',
            '`/vouch` - Confirmação rápida de entrega'
        ]
    },
    fun: {
        nome: '🎉 Diversão & Mini-games',
        descricao: 'Jogos, interações e zoeiras para engajar o chat.',
        comandos: [
            '`/8ball` - Bola 8 mística',
            '`/coinflip` - Gira moeda',
            '`/roll` - Rola dados',
            '`/ppt` - Pedra, papel e tesoura',
            '`/jogodavelha` - Jogo da velha 3x3',
            '`/duelo` - Duelo de lâminas de reflexo',
            '`/ship` - Medidor de química',
            '`/hackear` - Terminal hacker fake',
            '`/rate` - Nota de 0 a 100',
            '`/escolha` - Sorteia entre opções',
            '`/ascii` - Banner em arte ASCII',
            '`/inverter` - Inverte texto'
        ]
    },
    rp: {
        nome: '🎭 Roleplay & Social',
        descricao: 'Comandos de interação social entre amigos.',
        comandos: [
            '`/abracar` (ou `/hug`) - Dá um abraço quentinho',
            '`/beijar` (ou `/kiss`) - Dá um beijo carinhoso',
            '`/tapa` (ou `/slap`) - Dá um tapa/bofetada',
            '`/cafune` / `/carinho` (ou `/pat`) - Faz cafuné na cabeça',
            '`/tocaaqui` (ou `/highfive`) - Toca aqui / High Five'
        ]
    },
    staff: {
        nome: '🛡️ Moderação & Staff',
        descricao: 'Comandos restritos para equipe e administração.',
        comandos: [
            '`/clear` - Limpa mensagens',
            '`/ban` / `/unban` - Gerencia banimentos',
            '`/kick` - Expulsa membro',
            '`/timeout` / `/untimeout` - Castigo nativo',
            '`/warn` / `/warnings` / `/unwarn` - Ficha criminal',
            '`/snipe` - Revela mensagem apagada',
            '`/lock` / `/unlock` - Tranca chat',
            '`/slowmode` - Modo lento',
            '`/nuke` - Reinicia canal do zero',
            '`/role` - Adiciona/remove cargo',
            '`/setnick` - Altera apelido',
            '`/say` - Fala pelo bot',
            '`/embed` - Formulário de anúncio',
            '`/dm` - Notificação direta da loja',
            '`/addemoji` - Adiciona emoji',
            '`/addsticker` - Cria figurinha (sticker)',
            '`/sorteio` - Sistema de sorteios',
            '`/config` - Central de configuração dos 3 sistemas (Suporte, Tokens, Itens)'
        ]
    }
};

function getHelpMenu() {
    return new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('help_category_select')
            .setPlaceholder('Selecione uma categoria...')
            .addOptions([
                { label: 'Utilitários', value: 'util', description: 'Comandos de informações, ping e perfil', emoji: '🛠️' },
                { label: 'Loja & Clientes', value: 'loja', description: 'Roblox, taxa de robux e avaliações', emoji: '🛒' },
                { label: 'Diversão & Jogos', value: 'fun', description: 'Mini-games e brincadeiras no chat', emoji: '🎉' },
                { label: 'Roleplay', value: 'rp', description: 'Interações sociais entre membros', emoji: '🎭' },
                { label: 'Staff & Moderação', value: 'staff', description: 'Comandos restritos para moderação', emoji: '🛡️' }
            ])
    );
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Central de ajuda com todos os comandos da Kensai Store.'),
    async execute(interaction) {
        const embed = criarEmbedPadrao(
            '🗡️ Kensai Store — Central de Comandos',
            'Bem-vindo à central de ajuda do **Ken**!\n\n' +
            'Utilize o **Menu Dropdown** abaixo para navegar entre as categorias disponíveis.\n' +
            'Você também pode usar o prefixo padrão `k!` para os comandos.'
        );

        await interaction.reply({ embeds: [embed], components: [getHelpMenu()] });
    },
    async handleSelect(interaction, category) {
        const cat = CATEGORIAS[category];
        if (!cat) return;

        const embed = criarEmbedPadrao(cat.nome, `${cat.descricao}\n\n${cat.comandos.join('\n')}`);
        await interaction.update({ embeds: [embed], components: [getHelpMenu()] });
    }
};
