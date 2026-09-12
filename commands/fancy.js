// commands/fancy.js
/**
 * Fancy Text - Unicode Safe Version
 * Emojis Unicode escapes se likhe hain taake encoding corrupt na ho.
 */

let fetchFn;
try {
  fetchFn = global.fetch || require("node-fetch");
} catch {
  fetchFn = global.fetch;
}

// ? Unicode-safe emojis (kabhi corrupt nahi honge)
const EMOJI = {
  art:   "\u{1F3A8}",        // ?
  warn:  "\u26A0\uFE0F",     // ??
  cross: "\u274C",           // ?
  clock: "\u23F3",           // ?
  check: "\u2705",           // ?
  info:  "\u2139\uFE0F",     // ??
  bulb:  "\u{1F4A1}"         // ?
};

const CHAT_CACHE = new Map();
const CACHE_TTL = 1000 * 60 * 30;
const COOLDOWN = new Map();
const COOLDOWN_MS = 3000;

setInterval(() => {
  const now = Date.now();
  for (const [key, val] of CHAT_CACHE.entries()) {
    if (now - val.timestamp > CACHE_TTL) CHAT_CACHE.delete(key);
  }
}, 1000 * 60 * 10);

module.exports = {
  pattern: "fancy",
  desc: "Convert text into various fonts.",
  category: "fun",
  react: EMOJI.art,
  filename: __filename,
  use: "fancy <text> | fancy <number> | fancy random | fancy list",

  execute: async (conn, mek, m, { args, reply, from, sender }) => {
    try {
      if (!fetchFn) return reply(`${EMOJI.warn} Fetch available nahi hai.`);

      const userId = sender || m.sender || "unknown";
      const now = Date.now();
      if (COOLDOWN.has(userId) && now - COOLDOWN.get(userId) < COOLDOWN_MS) {
        const wait = ((COOLDOWN_MS - (now - COOLDOWN.get(userId))) / 1000).toFixed(1);
        return reply(`${EMOJI.clock} ${wait}s ruk jao.`);
      }
      COOLDOWN.set(userId, now);

      const getQuotedText = () => {
        const q =
          m?.quoted?.message ||
          mek?.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        if (!q) return null;
        return (
          q.conversation ||
          q.extendedTextMessage?.text ||
          q.imageMessage?.caption ||
          q.videoMessage?.caption ||
          q.documentMessage?.fileName ||
          null
        );
      };

      const getSafeMentionJid = () => {
        try {
          if (!m.sender) return [];
          const parts = m.sender.split("@");
          if (parts.length === 2 && parts[1] === "s.whatsapp.net") {
            return [`${parts[0]}@s.whatsapp.net`];
          }
          return [];
        } catch {
          return [];
        }
      };

      const chatId = from || m.chat || mek.key?.remoteJid || "global";
      const mentionedJid = getSafeMentionJid();

      const newsletterInfo = {
        newsletterJid: "120363428198797222@newsletter",
        newsletterName: "JAGGA MD",
        serverMessageId: 200
      };

      const sendCtx = async (text) => {
        await conn.sendMessage(chatId, {
          text,
          contextInfo: {
            mentionedJid,
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: newsletterInfo
          }
        }, { quoted: mek });
      };

      let styleNumber = null;
      let textToConvert = null;
      let isRandom = false;
      const quotedText = getQuotedText();
      const firstArg = (args[0] || "").toLowerCase();

      if (firstArg === "list" || firstArg === "help") {
        const cached = CHAT_CACHE.get(chatId);
        if (!cached) {
          return reply(`${EMOJI.info} Pehle \`.fancy <text>\` use karein.`);
        }
        let msg = `${EMOJI.art} *Available Styles for:* ${cached.text}\n\n`;
        cached.results.forEach((f, i) => {
          msg += `*${i + 1}*. ${f.name}\n`;
        });
        msg += `\n_Type_ \`.fancy <number>\` _to pick._`;
        return sendCtx(msg);
      }

      if (firstArg === "random" || firstArg === "r") {
        isRandom = true;
        if (args.length > 1) textToConvert = args.slice(1).join(" ");
        else if (quotedText) textToConvert = quotedText;
        else {
          const cached = CHAT_CACHE.get(chatId);
          if (cached) textToConvert = cached.text;
          else return reply(`${EMOJI.cross} Text nahi mila. Use \`.fancy random <text>\`.`);
        }
      } else if (!isNaN(args[0]) && args[0] !== "") {
        styleNumber = parseInt(args[0], 10);
        if (args.length > 1) textToConvert = args.slice(1).join(" ");
        else if (quotedText) textToConvert = quotedText;
        else {
          const cached = CHAT_CACHE.get(chatId);
          if (cached) textToConvert = cached.text;
          else return reply(`${EMOJI.cross} Pehle \`.fancy <text>\` use karein.`);
        }
      } else if (args.length > 0) {
        textToConvert = args.join(" ");
      } else {
        if (quotedText) textToConvert = quotedText;
        else {
          return reply(
            `${EMOJI.cross} *Usage:*\n` +
            "? `.fancy Hello World` ！ styles generate\n" +
            "? `.fancy 3` ！ style #3 pick\n" +
            "? `.fancy random` ！ random style\n" +
            "? `.fancy list` ！ styles list\n" +
            "? Reply karke `.fancy` likhein"
          );
        }
      }

      if (!textToConvert || !textToConvert.trim()) {
        return reply(`${EMOJI.warn} Text khali hai.`);
      }

      if (textToConvert.length > 200) {
        textToConvert = textToConvert.slice(0, 200);
      }

      const cachedData = CHAT_CACHE.get(chatId);
      if (
        styleNumber !== null &&
        cachedData &&
        cachedData.text === textToConvert &&
        Array.isArray(cachedData.results)
      ) {
        if (styleNumber < 1 || styleNumber > cachedData.results.length) {
          return reply(`${EMOJI.warn} Invalid style. 1 se ${cachedData.results.length}.`);
        }
        const chosen = cachedData.results[styleNumber - 1];
        return sendCtx(`${EMOJI.art} *Fancy (${styleNumber} - ${chosen.name}):*\n\n${chosen.result}`);
      }

      const apiUrl = `https://api.giftedtech.co.ke/api/tools/fancy?apikey=gifted&text=${encodeURIComponent(textToConvert)}`;

      let data;
      try {
        const res = await fetchFn(apiUrl);
        if (!res.ok) return reply(`${EMOJI.warn} API error: HTTP ${res.status}`);
        data = await res.json();
      } catch (e) {
        console.error("Fancy API error:", e.message);
        return reply(`${EMOJI.warn} API se connect nahi ho paya.`);
      }

      if (!data || !Array.isArray(data.results) || data.results.length === 0) {
        return reply(`${EMOJI.warn} API ne koi fonts return nahi kiye.`);
      }

      CHAT_CACHE.set(chatId, {
        text: textToConvert,
        results: data.results,
        timestamp: Date.now()
      });

      if (isRandom) {
        const idx = Math.floor(Math.random() * data.results.length);
        const chosen = data.results[idx];
        return sendCtx(`${EMOJI.art} *Fancy (Random - ${chosen.name}):*\n\n${chosen.result}`);
      }

      if (styleNumber !== null) {
        if (styleNumber < 1 || styleNumber > data.results.length) {
          return reply(`${EMOJI.warn} Invalid style. 1 se ${data.results.length}.`);
        }
        const chosen = data.results[styleNumber - 1];
        return sendCtx(`${EMOJI.art} *Fancy (${styleNumber} - ${chosen.name}):*\n\n${chosen.result}`);
      }

      let msg = `${EMOJI.art} *Fancy styles for:* ${textToConvert}\n`;
      msg += `_Type_ \`.fancy <number>\` _to pick ?_ \`.fancy random\` _for surprise_\n\n`;
      data.results.forEach((f, i) => {
        msg += `*${i + 1}*. ${f.result}\n   _(${f.name})_\n`;
      });
      msg += `\n${EMOJI.bulb} _Tip: Is message ko reply karke_ \`.fancy 5\` _likhein._`;

      return sendCtx(msg);

    } catch (err) {
      console.error("Error in fancy.js:", err);
      try {
        await conn.sendMessage(from || m.chat || mek.key?.remoteJid, {
          text: `${EMOJI.warn} Kuch masla ho gaya. Dobara try karein.`,
          contextInfo: {
            mentionedJid: [],
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
              newsletterJid: "120363428198797222@newsletter",
              newsletterName: "JAGGA MD",
              serverMessageId: 200
            }
          }
        }, { quoted: mek });
      } catch {}
    }
  }
};