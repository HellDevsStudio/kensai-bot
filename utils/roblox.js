const https = require('https');

function httpsGet(url) {
    return new Promise((resolve, reject) => {
        https.get(url, { headers: { 'User-Agent': 'HellDevs-Roblox-Client' } }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(data) });
                } catch {
                    resolve({ status: res.statusCode, data: null });
                }
            });
        }).on('error', reject);
    });
}

async function getRobloxUser(username) {
    try {
        const postData = JSON.stringify({ usernames: [username], excludeBannedUsers: false });
        const userReq = await new Promise((resolve, reject) => {
            const req = https.request({
                hostname: 'users.roblox.com',
                path: '/v1/usernames/users',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'HellDevs-Roblox-Client',
                    'Content-Length': Buffer.byteLength(postData)
                }
            }, (res) => {
                let d = '';
                res.on('data', c => d += c);
                res.on('end', () => {
                    try { resolve(JSON.parse(d)); } catch { resolve(null); }
                });
            });
            req.on('error', reject);
            req.write(postData);
            req.end();
        });

        if (!userReq || !userReq.data || userReq.data.length === 0) {
            return null;
        }

        const user = userReq.data[0];
        const userId = user.id;

        // Buscar detalhes completos (created at, bio)
        const details = await httpsGet(`https://users.roblox.com/v1/users/${userId}`);
        
        // Buscar avatar headshot
        const avatarRes = await httpsGet(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=420x420&format=Png&isCircular=false`);
        const avatarUrl = avatarRes?.data?.data?.[0]?.imageUrl || null;

        return {
            id: userId,
            name: user.name,
            displayName: user.displayName,
            hasVerifiedBadge: user.hasVerifiedBadge || false,
            created: details?.data?.created || null,
            description: details?.data?.description || 'Nenhuma biografia disponível.',
            profileUrl: `https://www.roblox.com/users/${userId}/profile`,
            avatarUrl: avatarUrl
        };
    } catch (e) {
        console.error('[Roblox API]', e.message);
        return null;
    }
}

module.exports = { getRobloxUser };
