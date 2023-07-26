import { ChatMessage } from './ChatMessage';

export interface ChatScraper {
    addMessages(messages: Array<ChatMessage>): void;
    chatBind(): void;
    getChatContainer(): Element | null;
    observeMutations(mutation: MutationRecord): Array<ChatMessage>;
}
