(function () {
    const main = document.querySelector("main");

    // Create WebSocket connection.
    let socket = new WebSocket("ws://localhost:3000/chat.ws");
    const reconnect = (socket) => {
        // check if socket is connected
        if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
            return true;
        }
        // attempt to connect
        socket = new WebSocket("ws://localhost:3000/chat.ws");
    };

    // Connection opened
    socket.addEventListener("open", (event) => {
        socket.send(
            JSON.stringify({
                id: crypto.randomUUID(),
                platform: "ChatOverlay",
                username: "ChatOverlay",
                message: "ChatOverlay connected.",
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
            })
        );
    });

    // Listen for messages
    socket.addEventListener("message", (event) => {
        const message = JSON.parse(event.data);
        console.log(message);
        // check if element already exists
        if (document.getElementById(message.id) === null) {
            let el = document.createElement("div");
            main.appendChild(el);
            el.outerHTML = message.html;
            el.scrollIntoView();

            while (main.children.length > 100) {
                main.removeChild(main.firstChild);
            }
        }
    });

    socket.addEventListener("close", (event) => {
        console.log("Socket has closed. Attempting reconnect.", event.reason);
        setTimeout(function () { reconnect(socket); }, 3000);
    });

    socket.addEventListener("error", (event) => {
        socket.close();
        setTimeout(function () { reconnect(socket); }, 3000);
    });
})();