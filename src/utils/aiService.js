const API_KEY = "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";

// List of free/stable models to rotate through if rate limited
const MODELS = [
    "google/gemini-2.0-flash-exp:free",
    "meta-llama/llama-3.1-8b-instruct:free",
    "mistralai/mistral-7b-instruct:free",
    "qwen/qwen-2-7b-instruct:free",
    "google/gemma-2-9b-it:free",
    "huggingfaceh4/zephyr-7b-beta:free",
    "gryphe/mythomax-l2-13b:free"
];

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const callAiWithFallback = async (prompt, systemContext, modelIndex = 0, retryCount = 0) => {
    if (modelIndex >= MODELS.length) {
        throw new Error("All AI models are currently unavailable or rate-limited.");
    }

    const currentModel = MODELS[modelIndex];

    try {
        console.log(`[AI] Attempting with model: ${currentModel} (Attempt ${retryCount + 1})`);

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`,
                'HTTP-Referer': 'http://localhost:3000',
                'X-Title': 'NewsAI'
            },
            body: JSON.stringify({
                model: currentModel,
                messages: [
                    { role: "system", content: systemContext },
                    { role: "user", content: prompt }
                ],
                temperature: 0.7,
                max_tokens: 1000
            })
        });

        if (response.status === 429) {
            console.warn(`[AI] Rate limited (429) on ${currentModel}`);

            // If we've retried a few times on this model, move to the next one
            if (retryCount < 2) {
                const backoff = Math.pow(2, retryCount) * 1000;
                console.log(`[AI] Retrying ${currentModel} after ${backoff}ms...`);
                await wait(backoff);
                return callAiWithFallback(prompt, systemContext, modelIndex, retryCount + 1);
            } else {
                console.log(`[AI] Max retries reached for ${currentModel}. Falling back to next model.`);
                return callAiWithFallback(prompt, systemContext, modelIndex + 1, 0);
            }
        }

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[AI] API Error (${response.status}):`, errorText);
            // For other errors, try fallback immediately
            return callAiWithFallback(prompt, systemContext, modelIndex + 1, 0);
        }

        const data = await response.json();
        const text = data.choices?.[0]?.message?.content;

        if (!text) throw new Error("AI returned an empty response body.");

        return text;

    } catch (error) {
        if (error.message.includes("All AI models")) throw error;

        console.error(`[AI] Fetch error with ${currentModel}:`, error);
        // On network error or other fetch failures, try the next model
        return callAiWithFallback(prompt, systemContext, modelIndex + 1, 0);
    }
};

export const callDeepSeek = async (prompt, systemContext = "You are a helpful news assistant.") => {
    try {
        const text = await callAiWithFallback(prompt, systemContext);
        return text;
    } catch (error) {
        console.error("Critical AI Service Failure:", error);
        return `AI Assistant is temporarily unavailable. Error: ${error.message}`;
    }
};

/**
 * Perform a semantic "vector" search by asking the AI to rank articles based on relevance.
 */
export const semanticRerank = async (query, articles) => {
    if (!articles || articles.length === 0) return [];

    const articleList = articles.slice(0, 15).map((a, i) => `${i}: ${a.title}`).join('\n');
    const prompt = `Given the search query: "${query}", rank the following news articles by relevance. 
    Return ONLY a comma-separated list of indices (e.g., 2,0,5) in order of most relevant to least relevant.
    
    Articles:
    ${articleList}`;

    try {
        const rankingResponse = await callDeepSeek(prompt, "You are a precise data filter. Return only the requested indices.");
        const indices = rankingResponse.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));

        const rankedArticles = indices.map(idx => articles[idx]).filter(Boolean);
        // Add back any articles that weren't ranked at the end
        const seenUrls = new Set(rankedArticles.map(a => a.url));
        const remaining = articles.filter(a => !seenUrls.has(a.url));

        return [...rankedArticles, ...remaining];
    } catch (err) {
        console.error("Semantic rerank failed, returning original list.", err);
        return articles;
    }
};


