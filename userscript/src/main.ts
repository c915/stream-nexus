import { OdyseeScraper } from './scrapers/OdyseeScraper';
import { RumbleScraper } from './scrapers/RumbleScraper';
import { YouTubeScraper } from './scrapers/YouTubeScraper';

if (document.location.host === 'www.youtube.com') {
    const ws = new WebSocket('ws://localhost:3000/chat.ws');
    const scraper = new YouTubeScraper(ws);
    scraper.chatBind();
}

if (document.location.host === 'odysee.com') {
    const ws = new WebSocket('ws://localhost:3000/chat.ws');
    const scraper = new OdyseeScraper(ws);
    scraper.chatBind();
}

if (document.location.host === 'rumble.com') {
    const ws = new WebSocket('ws://localhost:3000/chat.ws');
    const scraper = new RumbleScraper(ws);
    scraper.chatBind();
}
