import { YouTubeScraper } from './YouTubeScraper';

const ws = new WebSocket("ws://localhost:3000/chat.ws");
const scraper = new YouTubeScraper(ws);
scraper.chatBind();