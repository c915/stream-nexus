import { ChatMessage } from './ChatMessage';
import { ChatScraper } from './ChatScraper';

export class OdyseeScraper implements ChatScraper {
    ws: WebSocket;

    constructor(ws: WebSocket) {
        this.ws = ws;
    }

    addMessages(messages: Array<ChatMessage>): void {
        for (const message of messages) {
            this.ws.send(JSON.stringify(message));
        }
    }

    async chatBind(): Promise<void> {
        await this.waitForElement('.chat__wrapper');
        await this.waitForElement('.livestream__comments');

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
        return document.querySelector('.livestream__comments');
    }

    observeMutations(mutation: MutationRecord): ChatMessage[] {
        const messages = new Array<ChatMessage>();

        mutation.addedNodes.forEach((node) => {
            const element = node as HTMLElement;

            const sent_at_str = element
                .querySelector<HTMLElement>('.date_time')
                ?.getAttribute('title');
            let sent_at = Date.now();
            if (sent_at_str) {
                sent_at = Date.parse(sent_at_str);
            }

            // in strange conditions this can be null, I do not know why.
            const avatarContent = element
                .querySelector('.channel-thumbnail__custom')
                ?.getAttribute('src');
            let avatar = '';
            if (typeof avatarContent === 'string') {
                avatar = avatarContent;
            }

            const username =
                element.querySelector<HTMLElement>('.comment__author')
                    ?.innerText ?? '';
            const message =
                element.querySelector<HTMLElement>('.livestream-comment__text')
                    ?.innerText ?? '';

            let is_premium = false;
            let currency = '';
            let amount = 0.0;
            if (element.classList.contains('livestream__comment--hyperchat')) {
                is_premium = true;

                const creditAmount =
                    element.querySelector<HTMLElement>(
                        '.credit-amount',
                    )?.innerText;
                if (creditAmount) {
                    // Odysee hyperchats are either USD or $LBRY
                    currency = creditAmount.includes('$') ? 'USD' : '$LBRY';
                    amount = parseFloat(creditAmount.replace('$', ''));
                }
            }

            let is_mod = false;
            if (element.querySelector('.icon--BadgeMod')) {
                is_mod = true;
            }

            let is_owner = false;
            if (element.querySelector('.icon--BadgeStreamer')) {
                is_owner = true;
            }

            const chatMessage: ChatMessage = {
                id: crypto.randomUUID(),
                platform: 'Odysee',
                username,
                message,
                sent_at,
                received_at: Date.now(),
                avatar,
                is_premium,
                amount,
                currency,
                is_verified: false,
                is_sub: false,
                is_mod,
                is_owner,
                is_staff: false,
            };
            messages.push(chatMessage);
        });

        return messages;
    }

    waitForElement(selector: string) {
        return new Promise((resolve) => {
            if (document.querySelector(selector)) {
                return resolve(document.querySelector(selector));
            }

            const observer = new MutationObserver((_mutations) => {
                if (document.querySelector(selector)) {
                    resolve(document.querySelector(selector));
                    observer.disconnect();
                }
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true,
            });
        });
    }
}
