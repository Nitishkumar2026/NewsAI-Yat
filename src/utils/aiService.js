const API_KEY =
    (typeof process !== 'undefined' && process.env && process.env.REACT_APP_OPENROUTER_API_KEY) ||
    (typeof window !== 'undefined' ? window.localStorage.getItem('OPENROUTER_API_KEY') : '');

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

const fetchWithTimeout = async (url, options = {}, timeoutMs = 15000) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const res = await fetch(url, { ...options, signal: controller.signal, mode: 'cors', credentials: 'omit' });
        return res;
    } finally {
        clearTimeout(id);
    }
};

const callAiWithFallback = async (prompt, systemContext, modelIndex = 0, retryCount = 0) => {
    if (modelIndex >= MODELS.length) {
        throw new Error("All AI models are currently unavailable or rate-limited.");
    }

    const currentModel = MODELS[modelIndex];

    try {
        if (!API_KEY) {
            throw new Error("Missing API key. Set REACT_APP_OPENROUTER_API_KEY or localStorage OPENROUTER_API_KEY.");
        }
        console.log(`[AI] Attempting with model: ${currentModel} (Attempt ${retryCount + 1})`);

        const response = await fetchWithTimeout('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`,
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

