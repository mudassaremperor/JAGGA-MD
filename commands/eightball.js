// commands/8ball.js
/**
 * Magic 8-Ball - Unicode Safe Version (English Responses)
 */

// Unicode-safe emojis
const EMOJI = {
  ball:   "\u{1F3B1}",
  clock:  "\u23F3",
  warn:   "\u26A0\uFE0F",
  cross:  "\u274C",
  check:  "\u2705",
  no:     "\u{1F6AB}",
  think:  "\u{1F914}",
  fire:   "\u{1F525}",
  spark:  "\u2728",
  star:   "\u2B50",
  quest:  "\u2753",
  hundred:"\u{1F4AF}",
  target: "\u{1F3AF}",
  dice:   "\u{1F3B2}",
  sign:   "\u{1F44C}"
};

const COOLDOWN = new Map();
const COOLDOWN_MS = 2000; // 2 seconds

module.exports = {
  pattern: "8ball",
  desc: "Magic 8-Ball gives answers to your yes/no questions.",
  category: "fun",
  react: EMOJI.ball,
  filename: __filename,
  use: "8ball <yes/no question>",

  execute: async (conn, mek, m, { from, q, reply, sender }) => {
    try {
      // Cooldown
      const userId = sender || m.sender || "unknown";
      const now = Date.now();
      if (COOLDOWN.has(userId) && now - COOLDOWN.get(userId) < COOLDOWN_MS) {
        const wait = ((COOLDOWN_MS - (now - COOLDOWN.get(userId))) / 1000).toFixed(1);
        return reply(`${EMOJI.clock} Slow down! Wait ${wait}s before asking again.`);
      }
      COOLDOWN.set(userId, now);

      // Validation
      if (!q || !q.trim()) {
        return reply(
          `${EMOJI.ball} *Magic 8-Ball*\n\n` +
          `Ask a yes/no question!\n` +
          `*Example:* \`.8ball Will I be rich?\``
        );
      }

      if (q.length > 200) {
        return reply(`${EMOJI.warn} Question is too long. Keep it under 200 characters.`);
      }

      // Categorized responses (English)
      const positive = [
        `Absolutely! ${EMOJI.hundred}`,
        `Yes, for sure! ${EMOJI.check}`,
        `Definitely! ${EMOJI.target}`,
        `100% yes! ${EMOJI.fire}`,
        `Of course! ${EMOJI.spark}`,
        `Yes, that's right! ${EMOJI.sign}`,
        `All signs point to yes! ${EMOJI.star}`
      ];

      const negative = [
        `No. ${EMOJI.cross}`,
        `Absolutely not. ${EMOJI.no}`,
        `Never. ${EMOJI.cross}`,
        `No, forget about it. ${EMOJI.no}`,
        `The answer is NO. ${EMOJI.cross}`,
        `Chances are very low. ${EMOJI.no}`,
        `That's not going to happen. ${EMOJI.cross}`
      ];

      const neutral = [
        `Maybe... ${EMOJI.think}`,
        `I need to think about it. ${EMOJI.think}`,
        `Can't say right now. ${EMOJI.think}`,
        `Ask again later. ${EMOJI.clock}`,
        `Wait a bit longer. ${EMOJI.clock}`,
        `I don't know, honestly. ${EMOJI.think}`,
        `Leave it to fate. ${EMOJI.dice}`
      ];

      // Pick category then response
      const roll = Math.random();
      let answer, emoji;

      if (roll < 0.45) {
        answer = positive[Math.floor(Math.random() * positive.length)];
        emoji = EMOJI.check;
      } else if (roll < 0.8) {
        answer = negative[Math.floor(Math.random() * negative.length)];
        emoji = EMOJI.cross;
      } else {
        answer = neutral[Math.floor(Math.random() * neutral.length)];
        emoji = EMOJI.think;
      }

      // Safe mention JID
      let mentionedJid = [];
      try {
        if (m.sender && m.sender.includes("@s.whatsapp.net")) {
          mentionedJid = [m.sender];
        }
      } catch {}

      // Send reply
      await conn.sendMessage(from, {
        text:
          `${EMOJI.ball} *Magic 8-Ball*\n\n` +
          `${EMOJI.quest} *Question:* ${q}\n` +
          `${emoji} *Answer:* ${answer}`,
        contextInfo: {
          mentionedJid,
          forwardingScore: 999,
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
            newsletterJid: "120363428198797222@newsletter",
            newsletterName: "JAGGA MD",
            serverMessageId: 200
          }
        }
      }, { quoted: mek });

    } catch (err) {
      console.error("Error in 8ball.js:", err);
      try {
        await reply(`${EMOJI.warn} Something went wrong. Please try again.`);
      } catch {}
    }
  }
};
