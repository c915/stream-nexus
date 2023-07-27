import { OdyseeScraper } from './scrapers/OdyseeScraper';
import { RumbleScraper } from './scrapers/RumbleScraper';
import { YouTubeScraper } from './scrapers/YouTubeScraper';

(function () {
    const ws = new WebSocket('ws://localhost:3000/chat.ws');

    ws.addEventListener('open', (_event) => {
        if (document.location.host === 'www.youtube.com') {
            const scraper = new YouTubeScraper(ws);
            scraper.chatBind();
        }

        if (document.location.host === 'odysee.com') {
            const scraper = new OdyseeScraper(ws);
            scraper.chatBind();
        }

        if (document.location.host === 'rumble.com') {
            const scraper = new RumbleScraper(ws);
            scraper.chatBind();
        }
    });

    ws.addEventListener('error', (_event) => {
        console.log('Could not connect to Stream-Nexus WebSocket server.');
    });
})();
