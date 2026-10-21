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
        const tmp = filePath + '.tmp';
        fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf8');
        fs.renameSync(tmp, filePath);
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
    preco_por_1k: 18.50,
    categoria_id: null,
    canal_logs_id: null,
    cargo_staff_id: null,
    chave_pix: 'financeiro@kensaistore.com',
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

module.exports = {
    getSuporteConfig,
    setSuporteConfig,
    getTokensConfig,
    setTokensConfig,
    getItensConfig,
    setItensConfig
};
