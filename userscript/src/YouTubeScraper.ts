import { ChatScraper } from './ChatScraper';
import { ChatMessage } from './ChatMessage';

export class YouTubeScraper implements ChatScraper {
    ws: WebSocket;

    constructor(ws: WebSocket) {
        this.ws = ws;
    }

    addMessages(messages: Array<ChatMessage>): void {
        for (const message of messages) {
            this.ws.send(JSON.stringify(message));
        }
    }

    chatBind(): void {
        const targetNode = this.getChatContainer();
        if (targetNode === null) {
            throw new Error("Could not find chat container.");
        }
        targetNode.classList.add('sneed-chat-container');

        const config: MutationObserverInit = {
            childList: true,
            attributes: false,
            subtree: false,
        };

        const callback: MutationCallback = (mutationList, _observer) => {
            for (const mutation of mutationList) {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    const messages = this.observeMutations(mutation);
                    if (messages) {
                        this.addMessages(messages);
                    }
                }
            }
        };

        const observer = new MutationObserver(callback);
        observer.observe(targetNode, config);
    }

    getChatContainer(): Element | null {
        return document.querySelector('.yt-live-chat-item-list-renderer#items');
    }

    observeMutations(mutation: MutationRecord): Array<ChatMessage> {
        const messages = new Array<ChatMessage>();

        mutation.addedNodes.forEach((node) => {
            const element = node as HTMLElement;

            const avatar =
                element.querySelector<HTMLImageElement>('yt-img-shadow img')
                    ?.src ?? '';
            const username =
                element.querySelector<HTMLElement>('#author-name')?.innerText ??
                '';
            const message = element.querySelector('#message')?.innerHTML ?? '';

            let is_premium = false;
            let amount = 0;
            const currency = 'usd'; // ## TODO ## YT superchats are MANY currencies.
            if (element.tagName === 'yt-live-chat-paid-message-renderer') {
                is_premium = true;
                const purchase_amount = element.querySelector(
                    'purchase-amount',
                ) as HTMLElement;
                if (purchase_amount) {
                    amount = Number(purchase_amount.innerText);
                }
            }

            // The owner and subs copme from a top-level [author-type].
            let is_owner = false;
            let is_mod = false;
            let is_sub = false;
            const authorType = element.getAttribute('author-type');
            if (typeof authorType === 'string') {
                if (authorType.includes('owner')) {
                    is_owner = true;
                }
                if (authorType.includes('moderator')) {
                    is_mod = true;
                }
                if (authorType.includes('member')) {
                    is_sub = true;
                }
            }

            // "Verified" is exclusively denominated by a badge, but other types can be found that way too.
            // Whatever, just check the badges too.
            let is_verified = false;
            element.querySelectorAll(
                'yt-live-chat-author-badge-renderer.yt-live-chat-author-chip',
            ).forEach((badge) => {
                switch (badge.getAttribute('type')) {
                    case 'moderator':
                        is_mod = true;
                        break;
                    case 'verified':
                        is_verified = true;
                        break;
                    case 'member':
                        is_sub = true;
                        break;
                }
                // I don't think YouTuber staff will ever use live chat?
            });

            const chatMessage: ChatMessage = {
                id: crypto.randomUUID(),
                platform: 'YouTube',
                username,
                message,
                sent_at: Date.now(),
                received_at: Date.now(),
                avatar,
                is_premium,
                amount,
                currency,
                is_verified,
                is_sub,
                is_mod,
                is_owner,
                is_staff: false,
            };
            messages.push(chatMessage);
        });

        return messages;
    }
}
