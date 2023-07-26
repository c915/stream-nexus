// ==UserScript==
// @name         Stream Nexus for Enhanced Entertainment and Discourse - Rumble Extractor
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Unify, and SNEED!
// @author       Sneed
// @match        https://rumble.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=rumble.com
// @grant        none
// ==/UserScript==

window.SNEED_GET_CHAT_CONTAINER = () => {
    return document.getElementById("chat-history-list");
};

window.SNEED_OBSERVE_MUTATIONS = (mutation) => {
    let outMessage = {};

    mutation.addedNodes.forEach((node) => {
        let message = window.SNEED_GET_MESSAGE_DUMMY();
        message.platform = "Rumble";
        message.received_at = Date.now(); // Rumble provides no information.
        message.avatar = node.querySelector(".chat-history--user-avatar").src ?? message.avatar;

        if (node.classList.contains("chat-history--rant")) {
            message.username = node.querySelector(".chat-history--rant-username").innerText;
            message.message = node.querySelector(".chat-history--rant-text").innerHTML;
            message.is_premium = true;
            message.amount = parseFloat(node.querySelector(".chat-history--rant-price").innerText.replace("$", ""));
            message.currency = "USD"; // Rumble rants are always USD.
        }
        else {
            message.username = node.querySelector(".chat-history--username").innerText;
            message.message = node.querySelector(".chat-history--message").innerHTML;
        }

        node.querySelectorAll(".chat-history--user-badge").forEach((badge) => {
            if (badge.src.includes("moderator")) {
                message.is_mod = true;
            }
            else if (badge.src.includes("locals") || badge.src.includes("whale")) {
                message.is_sub = true;
            }
            else if (badge.src.includes("admin")) {
                // misnomer: this is the streamer.
                message.is_owner = true;
            }
            // Rumble staff badge unknown.
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