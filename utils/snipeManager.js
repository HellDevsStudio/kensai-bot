const snipes = new Map();

function setSnipe(channelId, data) {
    snipes.set(channelId, {
        ...data,
        timestamp: Date.now()
    });
}

function getSnipe(channelId) {
    return snipes.get(channelId) || null;
}

module.exports = { setSnipe, getSnipe };
