const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4000;

// CORS - Allow all localhost origins
app.use(cors({
    origin: true,
    credentials: true
}));

app.use(express.json());

// Health check
app.get('/health', (req, res) => {
    console.log('✅ Health check called');
    res.json({ status: 'OK', message: 'Backend proxy server is running' });
});

// MAIN ENDPOINT - Exact match for frontend
app.post('/api/analyze-facebook', async (req, res) => {
    console.log('🔥 Received request at /api/analyze-facebook');
    console.log('📦 Request body:', req.body);

    try {
        const { pageUrl, maxPosts = 30 } = req.body;

        if (!pageUrl) {
            console.log('❌ Missing pageUrl');
            return res.status(400).json({ error: 'pageUrl is required' });
        }

        const apifyToken = process.env.APIFY_API_TOKEN;
        if (!apifyToken) {
            console.log('❌ APIFY_API_TOKEN not configured');
            return res.status(500).json({ error: 'APIFY_API_TOKEN not configured in server/.env' });
        }

        console.log('� Starting Apify scrape for:', pageUrl);

        // Step 1: Start Apify actor
        const runResponse = await axios.post(
            `https://api.apify.com/v2/acts/apify/facebook-pages-scraper/runs?token=${apifyToken}`,
            {
                startUrls: [{ url: pageUrl }],
                maxPosts: maxPosts,
                scrapeAbout: true,
                scrapeReviews: false,
                scrapeServices: false
            },
            {
                headers: { 'Content-Type': 'application/json' }
            }
        );

        const runId = runResponse.data.data.id;
        console.log('⏳ Apify run started:', runId);

        // Step 2: Poll for completion
        let isFinished = false;
        let attempts = 0;
        const maxAttempts = 60; // 120 seconds max

        while (!isFinished && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 2000));

            const statusResponse = await axios.get(
                `https://api.apify.com/v2/actor-runs/${runId}?token=${apifyToken}`
            );

            const status = statusResponse.data.data.status;

            if (status === 'SUCCEEDED') {
                isFinished = true;
            } else if (status === 'FAILED' || status === 'ABORTED' || status === 'TIMED-OUT') {
                console.log('❌ Apify failed with status:', status);
                return res.status(500).json({ error: `Apify scrape failed: ${status}` });
            }

            attempts++;

            if (attempts % 5 === 0) {
                console.log(`⏳ Still waiting... (${attempts * 2}s)`);
            }
        }

        if (!isFinished) {
            console.log('❌ Timeout after 120s');
            return res.status(408).json({ error: 'Scrape timeout (>120s)' });
        }

        console.log('✅ Scrape completed!');

        // Step 3: Get results
        const resultsResponse = await axios.get(
            `https://api.apify.com/v2/actor-runs/${runId}/dataset/items?token=${apifyToken}`
        );

        const results = resultsResponse.data;

        if (!results || results.length === 0) {
            console.log('❌ No data returned');
            return res.status(404).json({ error: 'No data returned from Apify' });
        }

        console.log(`✅ Returning data for: ${results[0].name || 'unknown'}`);

        // Return first result
        res.json(results[0]);

    } catch (error) {
        console.error('❌ Backend error:', error.message);

        if (error.response) {
            console.error('Apify API error:', error.response.data);
            return res.status(error.response.status).json({
                error: 'Apify API error',
                message: error.response.data?.error?.message || error.message
            });
        }

        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log('');
    console.log('🚀 Backend proxy server running');
    console.log(`📡 Health: http://localhost:${PORT}/health`);
    console.log(`📡 API: POST http://localhost:${PORT}/api/analyze-facebook`);
    console.log('');
});
