export interface ChatMessage {
    id: string;
    platform: string;
    username: string;
    message: string;
    sent_at: number;
    received_at: number;
    avatar: string;
    is_premium: boolean;
    amount: number;
    currency: string;
    is_verified: boolean;
    is_sub: boolean;
    is_mod: boolean;
    is_owner: boolean;
    is_staff: boolean;
}
