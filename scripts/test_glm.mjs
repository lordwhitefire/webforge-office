import ZAI from 'z-ai-web-dev-sdk';

async function test() {
    const zai = await ZAI.create();
    const completion = await zai.chat.completions.create({
        messages: [
            { role: 'user', content: 'Say hello in one word' }
        ],
        model: 'glm-4.5-flash',
        max_tokens: 10,
        thinking: { type: 'disabled' }
    });
    console.log('GLM Response:', completion.choices[0]?.message?.content);
    console.log('Model:', completion.model);
}

test().catch(e => console.error('Error:', e.message));
