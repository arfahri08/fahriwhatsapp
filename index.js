const { default: makeWASocket, useMultiFileAuthState } = require("@whiskeysockets/baileys")
const P = require("pino")
const OpenAI = require("openai")

const ai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
})

// ===== STATE =====
let afk = false
let afkReason = ""

// ===== AI FUNCTION =====
async function aiReply(text) {
    try {
        const res = await ai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: "Kamu manusia Indonesia, santai, natural, tidak kaku, jawab singkat seperti chat biasa."
                },
                {
                    role: "user",
                    content: text
                }
            ]
        })

        return res.choices[0].message.content

    } catch (e) {
        console.log("AI ERROR:", e)
        return "Bentar ya..."
    }
}

// ===== DELAY =====
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

// ===== MAIN BOT =====
async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState("auth")

    const sock = makeWASocket({
        auth: state,
        logger: P({ level: "silent" })
    })

    sock.ev.on("creds.update", saveCreds)

    sock.ev.on("messages.upsert", async ({ messages }) => {
        const msg = messages[0]
        if (!msg.message) return

        const from = msg.key.remoteJid
        const isMe = msg.key.fromMe

        const text =
            msg.message.conversation ||
            msg.message.extendedTextMessage?.text ||
            ""

        // ===== COMMAND (HANYA KAMU) =====
        if (isMe) {
            if (text.startsWith(".afk")) {
                afk = true
                afkReason = text.replace(".afk", "") || "lagi sibuk"
                await sock.sendMessage(from, { text: "AFK aktif" })
                return
            }

            if (text === ".unafk") {
                afk = false
                await sock.sendMessage(from, { text: "AFK off" })
                return
            }

            if (text === ".alive") {
                await sock.sendMessage(from, { text: "Bot aktif ✅" })
                return
            }
        }

        // ===== IGNORE MESSAGE SENDIRI =====
        if (isMe) return

        // ===== AFK AUTO REPLY =====
        if (afk) {
            await sock.sendMessage(from, {
                text: `Sedang (${afkReason}). Saat ini bot yang menanggapi`
            })
            return
        }

        // ===== DELAY NATURAL =====
        await delay(2000 + Math.random() * 3000)

        // ===== AI REPLY =====
        const reply = await aiReply(text)
        await sock.sendMessage(from, { text: reply })
    })
}

startBot()
