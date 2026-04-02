import axios from 'axios';
import * as cheerio from 'cheerio';

async function testScrape() {
    console.log('Testing scraper for Advertising Vietnam...');
    try {
        const { data: html } = await axios.get('https://advertisingvietnam.com/latest', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        console.log('Fetch successful, HTML length:', html.length);
        const $ = cheerio.load(html);

        let found = 0;
        $('a').each((i, el) => {
            const href = $(el).attr('href');
            if (href && (href.includes('/article/') || href.includes('/post/'))) {
                console.log(`Found candidate link: ${href}`);
                found++;
            }
        });

        console.log('Total candidate links found:', found);

        // Log first 500 chars of HTML to check likely structure if 0 found
        if (found === 0) {
            console.log('First 1000 chars of HTML:', html.substring(0, 1000));
        }

    } catch (error) {
        console.error('Error fetching:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
        }
    }
}

testScrape();
