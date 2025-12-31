/**
 * Utility to fetch and extract the main content from a news article URL.
 * Uses AllOrigins CORS proxy to bypass cross-origin restrictions.
 */
export const extractFullContent = async (url) => {
    try {
        // Primary Proxy: AllOrigins
        let proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
        let response = await fetch(proxyUrl);
        let html;

        if (response.ok) {
            const data = await response.json();
            html = data.contents;
        } else {
            // Secondary Proxy: CORSProxy.io (Fallback)
            proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
            response = await fetch(proxyUrl);
            if (!response.ok) throw new Error("All proxies failed");
            html = await response.text();
        }

        // Basic extraction logic: 
        // 1. Create a dummy DOM to parse the string
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");

        // 2. Remove script, style, and navigation tags
        const toRemove = doc.querySelectorAll('script, style, nav, footer, header, ads, .ads, .sidebar, .comments');
        toRemove.forEach(el => el.remove());

        // 3. Try to find the main article body
        // Common selectors for main content
        const selectors = [
            'article',
            '.article-content',
            '.post-content',
            '.entry-content',
            'main',
            '#main-content',
            '.story-body',
            '.article-body'
        ];

        let mainElement = null;
        for (const selector of selectors) {
            mainElement = doc.querySelector(selector);
            if (mainElement) break;
        }

        // 4. Fallback: if no clear container, just get all paragraph text
        if (!mainElement) {
            const paragraphs = Array.from(doc.querySelectorAll('p'))
                .map(p => p.innerText.trim())
                .filter(p => p.length > 50); // Filter out short snippets

            if (paragraphs.length > 0) {
                return paragraphs.join('\n\n');
            }
        }

        if (mainElement) {
            // Further clean-up of the main element
            const paragraphs = Array.from(mainElement.querySelectorAll('p'))
                .map(p => p.innerText.trim())
                .filter(p => p.length > 30);

            return paragraphs.join('\n\n');
        }

        return "Unable to extract full text for this article. Please use the 'Source' link to read it on the original website.";
    } catch (error) {
        console.error("Extraction error:", error);
        return "Extraction failed due to network or site restrictions.";
    }
};
