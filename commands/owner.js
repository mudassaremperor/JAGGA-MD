// === commands/owner.js ===
module.exports = {
    pattern: "owner",
    desc: "Get bot owner contact card",
    category: "info",
    filename: __filename,
    use: ".owner",

    execute: async (conn, message, m, { from, reply }) => {
        try {
            // Contact 1
            const vcard1 = 'BEGIN:VCARD\n' +
                          'VERSION:1.0\n' +
                          'FN:𓆩֓⤹𝙏𝙃ع 𝙅𝘼𝙂𝙂𝘼 ⁹¹⤸֓𓆪\n' +
                          'TEL;type=CELL;type=VOICE;waid=923184288564:+923 1842 88564\n' +
                          'END:VCARD';

            // Send contact in ONE message
            await conn.sendMessage(from, {
                contacts: {
                    displayName: '𓆩֓⤹𝙏𝙃ع 𝙅𝘼𝙂𝙂𝘼 ⁹¹⤸֓𓆪',
                    contacts: [
                        { vcard: vcard1 },
                    ]
                }
            }, { quoted: message });

        } catch (err) {
            console.error("Owner command error:", err);
            reply("❌ Failed to send contact card.");
        }
    }
};