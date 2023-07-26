// ==UserScript==
// @name         Stream Nexus for Enhanced Entertainment and Discourse - Youtube Extractor
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Unify, and SNEED!
// @author       Sneed
// @match        https://www.youtube.com/live_chat*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=youtube.com
// @grant        none
// ==/UserScript==

window.SNEED_GET_CHAT_CONTAINER = () => {
    // The YT DOM is a mess. This is specific.
    return document.querySelector(".yt-live-chat-item-list-renderer#items");
};

window.SNEED_OBSERVE_MUTATIONS = (mutation) => {
    let outMessage = {};

    mutation.addedNodes.forEach((node) => {
        let message = window.SNEED_GET_MESSAGE_DUMMY();
        message.platform = "YouTube";
        message.received_at = Date.now(); // Rumble provides no information.

        message.avatar = node.querySelector("yt-img-shadow img").src;
        message.username = node.querySelector("#author-name").innerText;
        message.message = node.querySelector("#message").innerHTML;

        if (node.tagName === "yt-live-chat-paid-message-renderer") {
            const dono = node.querySelector("purchase-amount").innerText;
            message.is_premium = true;
            message.amount = Number(dono.replace(/[^0-9.-]+/g,""));
            message.currency = "USD"; // ## TODO ## YT superchats are MANY currencies.
        }

        // The owner and subs copme from a top-level [author-type].
        const authorType = node.getAttribute("author-type");
        if (typeof authorType === "string") {
            if (authorType.includes("owner")) {
                message.is_owner = true;
            }
            if (authorType.includes("moderator")) {
                message.is_mod = true;
            }
            if (authorType.includes("member")) {
                message.is_sub = true;
            }
        }

        // "Verified" is exclusively denominated by a badge, but other types can be found that way too.
        // Whatever, just check the badges too.
        node.querySelectorAll("yt-live-chat-author-badge-renderer.yt-live-chat-author-chip").forEach((badge) => {
            switch (badge.getAttribute("type")) {
                case "moderator": message.is_mod = true; break;
                case "verified": message.is_verified = true; break;
                case "member": message.is_sub = true; break;
            }
            // I don't think YouTuber staff will ever use live chat?
        });

        outMessage = message;
    });

    return outMessage;
};

// Ensure this matches the Rust object in feed/mod.rs
window.SNEED_GET_MESSAGE_DUMMY = () => {
    return {
        id: crypto.randomUUID(),
        platform: "IDK",
        username: "DUMMY_USER",
        message: "Hello World",
        sent_at: Date.now(), // System timestamp for display ordering.
        received_at: Date.now(), // Local timestamp for management.
        avatar: "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==",
        is_premium: false,
        amount: 0,
        currency: "ZWL",
        is_verified: false,
        is_sub: false,
        is_mod: false,
        is_owner: false,
        is_staff: false,
    };
};

window.SNEED_ADD_MESSAGES = (new_message, ws) => {
    ws.send(JSON.stringify(new_message));
};

window.SNEED_CHAT_BIND = (ws) => {
    const targetNode = window.SNEED_GET_CHAT_CONTAINER();
    targetNode.classList.add("sneed-chat-container");

    const config = {
        childList: true,
        attributes: false,
        subtree: false
    };
    const callback = (mutationList, observer) => {
    for (const mutation of mutationList) {
        if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
            const message = window.SNEED_OBSERVE_MUTATIONS(mutation);
            if (message) {
                window.SNEED_ADD_MESSAGES(message, ws);
            }
        }
    }
    };

    const observer = new MutationObserver(callback);
    observer.observe(targetNode, config);
};

(function() {
    'use strict';

    const socket = new WebSocket("ws://localhost:3000/chat.ws");

    window.SNEED_CHAT_BIND(socket);
    setInterval(function () {
        if (document.querySelector(".sneed-chat-container") === null) {
            // You _WILL_ sneed and you _WILL_ be happy.
            window.SNEED_CHAT_BIND(socket);
        }
    }, 1000);
})();