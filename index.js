const { default: makeWASocket, useMultiFileAuthState } = require("@whiskeysockets/baileys")
const P = require("pino")

const { aiReply } = require("./modules/ai")
const afk = require("./modules/afk")
const { delay } = require("./modules/delay")

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

        // ===== COMMAND =====
        if (isMe) {
            if (text.startsWith(".afk")) {
                afk.setAFK(text.replace(".afk", ""))
                await sock.sendMessage(from, { text: "AFK aktif" })
                return
            }

            if (text === ".unafk") {
                afk.clearAFK()
                await sock.sendMessage(from, { text: "AFK off" })
                return
            }

            if (text === ".alive") {
                await sock.sendMessage(from, { text: "Bot aktif ✅" })
                return
            }
        }

        // ===== IGNORE DIRI SENDIRI =====
        if (isMe) return

        // ===== AFK =====
        if (afk.isAFK()) {
            await sock.sendMessage(from, {
                text: `Sedang (${afk.getReason()}). Saat ini bot yang menanggapi`
            })
            return
        }

        // ===== DELAY =====
        await delay(2000 + Math.random() * 3000)

        // ===== AI =====
        const reply = await aiReply(text)
        await sock.sendMessage(from, { text: reply })
    })
}

startBot()
