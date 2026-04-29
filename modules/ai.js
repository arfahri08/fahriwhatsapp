const OpenAI = require("openai")

const ai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
})

async function aiReply(text) {
    try {
        const res = await ai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: "Kamu manusia Indonesia santai, jawab pendek dan natural seperti chat biasa"
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

module.exports = { aiReply }
