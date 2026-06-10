import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

const PROMPT = `You are a productivity assistant. Given a raw task description, return a JSON object with two fields:
- "title": a concise, action-oriented task title (max 60 characters)
- "description": a clear one-sentence description of what needs to be done (max 150 characters)

Return ONLY valid JSON. No markdown, no explanation, no extra text.`

export async function enhanceTask(rawInput: string): Promise<{ title: string; description: string }> {
    const completion = await groq.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [
            { role: 'system', content: PROMPT },
            { role: 'user', content: rawInput },
        ],
        temperature: 0.3,
        max_tokens: 200,
    })

    const content = completion.choices[0]?.message?.content?.trim() ?? ''
    const cleaned = content.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
    const parsed = JSON.parse(cleaned)

    if (typeof parsed.title !== 'string' || typeof parsed.description !== 'string') {
        throw new Error('Unexpected response shape from Groq')
    }

    return { title: parsed.title, description: parsed.description }
}
