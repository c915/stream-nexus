// ==UserScript==
// @name         Stream Nexus for Enhanced Entertainment and Discourse - Odysee Extractor
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Unify, and SNEED!
// @author       Sneed
// @match        https://odysee.com/*/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=odysee.com
// @grant        none
// @run-at document-idle
// ==/UserScript==

window.SNEED_GET_CHAT_CONTAINER = () => {
    return document.querySelector(".livestream__comments");
}

window.SNEED_OBSERVE_MUTATIONS = (mutation) => {
    let outMessage = {};

    mutation.addedNodes.forEach((node) => {
        const message = window.SNEED_GET_MESSAGE_DUMMY();
        message.platform = "Odysee";
        message.sent_at = Date.parse(node.querySelector(".date_time").getAttribute("title"));
        message.received_at = Date.now();

        // in strange conditions this can be null, I do not know why.
        const avatar = node.querySelector(".channel-thumbnail__custom")?.getAttribute("src");
        if (typeof avatar === "string") {
            message.avatar = node.querySelector(".channel-thumbnail__custom")?.getAttribute("src");
        }
        message.username = node.querySelector(".comment__author").innerText;
        message.message = node.querySelector(".livestream-comment__text").innerText;

        if (node.classList.contains("livestream__comment--hyperchat")) {
            message.is_premium = true;

            const amount = node.querySelector(".credit-amount").innerText;
            message.currency = amount.includes("$") ? "USD" : "$LBRY"; // Odysee hyperchats are either USD or $LBRY
            message.amount = parseFloat(amount.replace("$", ""));
        }

        if (node.querySelector(".icon--BadgeMod")) {
            message.is_mod = true;
        }
        if (node.querySelector(".icon--BadgeStreamer")) {
            message.is_owner = true;
        }

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
    waitForElm(".livestream__comments")
        .then((elm) => {
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
    });
};

// https://stackoverflow.com/a/61511955
function waitForElm(selector) {
    return new Promise(resolve => {
        if (document.querySelector(selector)) {
            return resolve(document.querySelector(selector));
        }

        const observer = new MutationObserver(mutations => {
            if (document.querySelector(selector)) {
                resolve(document.querySelector(selector));
                observer.disconnect();
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    });
};

(function() {
    'use strict';

    // Odysee is kinda janky, witing for element '.livestream__comments'
    // directly doesn't work, and if you don't wait for '.chat__wrapper'
    // first, chats will be sent 3 times to chat server.
    waitForElm(".chat__wrapper")
        .then((elm) => {
        const socket = new WebSocket("ws://localhost:3000/chat.ws");

        window.SNEED_CHAT_BIND(socket);
        setInterval(function () {
            if (document.querySelector(".sneed-chat-container") === null) {
                // You _WILL_ sneed and you _WILL_ be happy.
                window.SNEED_CHAT_BIND(socket);
            }
        }, 1000);
    });
})();