/**
 * Shortener Service
 * Implements Hybrid Logic: Bitly v4 -> Fallback to TinyURL
 */

interface ShortenResponse {
    shortUrl: string | null;
    provider: 'bitly' | 'tinyurl' | null;
    error?: string;
}

export const shortenUrl = async (longUrl: string, bitlyToken?: string | null): Promise<ShortenResponse> => {
    // 1. Priority: Check Bitly Token
    if (bitlyToken && bitlyToken.trim() !== '') {
        try {
            const response = await fetch('https://api-ssl.bitly.com/v4/shorten', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${bitlyToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    long_url: longUrl,
                    domain: "bit.ly"
                })
            });

            if (response.ok) {
                const data = await response.json();
                return { shortUrl: data.link, provider: 'bitly' };
            } else {
                console.warn("Bitly API failed (Token might be invalid or limit reached). Falling back to TinyURL...");
            }
        } catch (error) {
            console.error("Bitly Network Error:", error);
            // Proceed to fallback
        }
    }

    // 2. Fallback / Default: TinyURL
    // Note: TinyURL api-create.php supports CORS in most modern browser contexts for GET requests.
    try {
        const tinyUrlEndpoint = `https://tinyurl.com/api-create.php?url=${encodeURIComponent(longUrl)}`;
        const response = await fetch(tinyUrlEndpoint);
        
        if (response.ok) {
            const text = await response.text();
            if (text.startsWith('http')) {
                return { shortUrl: text, provider: 'tinyurl' };
            }
        }
    } catch (error) {
        console.error("TinyURL Network Error:", error);
    }

    // 3. All failed
    return { shortUrl: null, provider: null, error: "Failed to shorten link with both providers." };
};