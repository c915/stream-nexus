import { ChatMessage } from '../ChatMessage';
import { ChatScraper } from '../ChatScraper';

export class RumbleScraper implements ChatScraper {
    ws: WebSocket;

    constructor(ws: WebSocket) {
        this.ws = ws;
    }

    addMessages(messages: ChatMessage[]): void {
        for (const message of messages) {
            this.ws.send(JSON.stringify(message));
        }
    }

    chatBind(): void {
        const targetNode = this.getChatContainer();
        if (targetNode === null) {
            throw new Error('Could not find chat container.');
        }
        targetNode.classList.add('sneed-chat-container');

        const config: MutationObserverInit = {
            childList: true,
            attributes: false,
            subtree: false,
        };

        const callback: MutationCallback = (mutationList, _observer) => {
            for (const mutation of mutationList) {
                if (
                    mutation.type === 'childList' &&
                    mutation.addedNodes.length > 0
                ) {
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
        return document.getElementById('chat-history-list');
    }

    observeMutations(mutation: MutationRecord): ChatMessage[] {
        const messages = new Array<ChatMessage>();

        mutation.addedNodes.forEach((node) => {
            const element = node as HTMLElement;

            // Rumble defaults avatars to letters which are embedded via CSS 
            // thus ends up empty, use Rumble logo instead.
            const avatar =
                element.querySelector<HTMLImageElement>(
                    '.chat-history--user-avatar',
                )?.src ?? 'https://rumble.com/i/favicon-v4.png';

            let username = '';
            let message = '';
            let is_premium = false;
            let amount = 0.0;
            if (element.classList.contains('chat-history--rant')) {
                username =
                    element.querySelector<HTMLElement>(
                        '.chat-history--rant-username',
                    )?.innerText ?? '';

                message =
                    element.querySelector<HTMLElement>(
                        '.chat-history--rant-text',
                    )?.innerHTML ?? '';

                is_premium = true;
                const rantElem = element.querySelector<HTMLElement>(
                    '.chat-history--rant-price',
                );
                if (rantElem) {
                    amount = parseFloat(rantElem.innerHTML.replace('$', ''));
                }
            } else {
                username =
                    element.querySelector<HTMLElement>(
                        '.chat-history--username',
                    )?.innerText ?? '';

                message =
                    element.querySelector<HTMLElement>('.chat-history--message')
                        ?.innerHTML ?? '';
            }

            let is_mod = false;
            let is_sub = false;
            let is_owner = false;
            element
                .querySelectorAll('.chat-history--user-badge')
                .forEach((badge) => {
                    const badgeImgElement = badge as HTMLImageElement;
                    if (badgeImgElement.src.includes('moderator')) {
                        is_mod = true;
                    } else if (
                        badgeImgElement.src.includes('locals') ||
                        badgeImgElement.src.includes('whale')
                    ) {
                        is_sub = true;
                    } else if (badgeImgElement.src.includes('admin')) {
                        // misnomer: this is the streamer.
                        is_owner = true;
                    }
                    // Rumble staff badge unknown.
                });

            const chatMessage: ChatMessage = {
                id: crypto.randomUUID(),
                platform: 'Rumble',
                username,
                message,
                sent_at: Date.now(),
                received_at: Date.now(),
                avatar,
                is_premium,
                amount,
                currency: 'USD',
                is_verified: false,
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
