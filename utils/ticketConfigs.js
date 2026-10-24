const fs = require('fs');
const path = require('path');

const CONFIGS_DIR = path.join(__dirname, '..', 'data', 'configs');
if (!fs.existsSync(CONFIGS_DIR)) {
    fs.mkdirSync(CONFIGS_DIR, { recursive: true });
}

function getConfigPath(name) {
    return path.join(CONFIGS_DIR, name + '.json');
}

function readConfigFile(name, defaults) {
    const filePath = getConfigPath(name);
    try {
        if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, JSON.stringify(defaults, null, 2), 'utf8');
            return defaults;
        }
        const content = fs.readFileSync(filePath, 'utf8');
        return Object.assign({}, defaults, JSON.parse(content));
    } catch (e) {
        console.error('[Config] Erro ao ler ' + name + '.json:', e.message);
        return defaults;
    }
}

function writeConfigFile(name, data) {
    const filePath = getConfigPath(name);
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
        return true;
    } catch (e) {
        console.error('[Config] Erro ao gravar ' + name + '.json:', e.message);
        return false;
    }
}

// 1. SUPORTE CONFIG
const DEFAULT_SUPORTE = {
    categoria_id: null,
    canal_logs_id: null,
    cargo_staff_id: null,
    canal_painel_id: null,
    mensagem_painel_id: null
};

function getSuporteConfig() {
    return readConfigFile('suporte', DEFAULT_SUPORTE);
}

function setSuporteConfig(updates) {
    const current = getSuporteConfig();
    const updated = Object.assign({}, current, updates);
    writeConfigFile('suporte', updated);
    return updated;
}

// 2. TOKENS CONFIG
const DEFAULT_TOKENS = {
    preco_por_1k: 18.00,
    categoria_id: null,
    canal_logs_id: null,
    cargo_staff_id: null,
    chave_pix: 'kensai.store.oficial@gmail.com',
    canal_painel_id: null,
    mensagem_painel_id: null
};

function getTokensConfig() {
    return readConfigFile('tokens', DEFAULT_TOKENS);
}

function setTokensConfig(updates) {
    const current = getTokensConfig();
    const updated = Object.assign({}, current, updates);
    writeConfigFile('tokens', updated);
    return updated;
}

// 3. ITENS CONFIG
const DEFAULT_ITENS = {
    categoria_id: null,
    canal_logs_id: null,
    cargo_staff_id: null,
    canal_painel_id: null,
    mensagem_painel_id: null,
    itens: [
        { id: 'katana_kensai', nome: 'Katana Kensai Mística', preco: 'R$ 25,00', descricao: 'Espada com efeito de chamas roxas' },
        { id: 'passe_vip', nome: 'Passe VIP Kensai', preco: 'R$ 15,00', descricao: 'Vantagens exclusivas e badge no servidor' },
        { id: 'set_sombras', nome: 'Set Guerreiro das Sombras', preco: 'R$ 40,00', descricao: 'Armadura completa + 2 espadas afiadas' },
        { id: 'encomenda_custom', nome: 'Encomenda Personalizada', preco: 'A Combinar', descricao: 'Itens ou encomendas sob medida' }
    ]
};

function getItensConfig() {
    return readConfigFile('itens', DEFAULT_ITENS);
}

function setItensConfig(updates) {
    const current = getItensConfig();
    const updated = Object.assign({}, current, updates);
    writeConfigFile('itens', updated);
    return updated;
}


// 4. SPINS & PASSES CONFIG
const DEFAULT_SPINS_PASSES = {
    categoria_id: null,
    canal_logs_id: null,
    cargo_staff_id: null,
    chave_pix: 'kensai.store.oficial@gmail.com',
    canal_painel_id: null,
    mensagem_painel_id: null,
    produtos: [
        { id: 'spin_50', tipo: 'spin', nome: '50 Spins', preco: '10.00', emoji: '🌀', descricao: 'Pacote de 50 Spins para roletar espadas e efeitos' },
        { id: 'spin_100', tipo: 'spin', nome: '100 Spins', preco: '18.00', emoji: '🌀', descricao: 'Pacote de 100 Spins com entrega imediata' },
        { id: 'spin_250', tipo: 'spin', nome: '250 Spins', preco: '40.00', emoji: '🌀', descricao: 'Pacote de 250 Spins de alto rendimento' },
        { id: 'spin_500', tipo: 'spin', nome: '500 Spins', preco: '75.00', emoji: '🌀', descricao: 'Pacote de 500 Spins para caçadores de míticos' },
        { id: 'spin_1000', tipo: 'spin', nome: '1.000 Spins', preco: '140.00', emoji: '🌀', descricao: 'Pacote colossal de 1.000 Spins' },
        { id: 'passe_vip', tipo: 'passe', nome: 'Passe VIP Blade Ball', preco: '15.00', emoji: '🎟️', descricao: 'Vantagens exclusivas e status VIP no jogo' },
        { id: 'passe_batalha', tipo: 'passe', nome: 'Passe de Batalha (Battlepass)', preco: '25.00', emoji: '🎟️', descricao: 'Desbloqueio de todas as recompensas da temporada' },
        { id: 'passe_autoparry', tipo: 'passe', nome: 'Auto-Parry Assist Pass', preco: '35.00', emoji: '🎟️', descricao: 'Gamepass de assistência avançada de parry' },
        { id: 'passe_custom', tipo: 'passe', nome: 'Passe Personalizado / Outra Gamepass', preco: 'A Combinar', emoji: '📦', descricao: 'Encomenda de qualquer outro passe ou item sob medida' }
    ]
};

function getSpinsPassesConfig() {
    return readConfigFile('spins_passes', DEFAULT_SPINS_PASSES);
}

function setSpinsPassesConfig(updates) {
    const current = getSpinsPassesConfig();
    const updated = Object.assign({}, current, updates);
    writeConfigFile('spins_passes', updated);
    return updated;
}

module.exports = {
    getSuporteConfig,
    setSuporteConfig,
    getTokensConfig,
    setTokensConfig,
    getItensConfig,
    setItensConfig,
    getSpinsPassesConfig,
    setSpinsPassesConfig
};
