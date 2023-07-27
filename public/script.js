// https://stackoverflow.com/a/23176223
function connect(reconnected = false) {
    const main = document.querySelector('main');
    const ws = new WebSocket('ws://localhost:3000/chat.ws');

    ws.addEventListener('open', (_event) => {
        if (ws.readyState !== WebSocket.OPEN) {
            return;
        }

        const message = {
            id: crypto.randomUUID(),
            platform: 'ChatOverlay',
            username: 'ChatOverlay',
            message: 'ChatOverlay connected.',
            sent_at: Date.now(), // System timestamp for display ordering.
            received_at: Date.now(), // Local timestamp for management.
            avatar: 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==',
            is_premium: false,
            amount: 0,
            currency: 'ZWL',
            is_verified: false,
            is_sub: false,
            is_mod: false,
            is_owner: false,
            is_staff: false,
        };

        if (reconnected) {
            message.message = 'ChatOverlay reconnected.'
        }

        ws.send(JSON.stringify(message));
    });

    ws.addEventListener('message', (event) => {
        const message = JSON.parse(event.data);
        console.log(message);
        // check if element already exists
        if (document.getElementById(message.id) === null) {
            let el = document.createElement('div');
            main.appendChild(el);
            el.outerHTML = message.html;
            el.scrollIntoView();

            while (main.children.length > 100) {
                main.removeChild(main.firstChild);
            }
        }
    });

    ws.addEventListener('close', (event) => {
        console.log('Socket connection closed. Attempting reconnect in 1 second.');
        setTimeout(() => {
            connect(true)
        }, 1000);
    });

    ws.addEventListener('error', (error) => {
        console.error('Could not connect to Stream-Nexus WebSocket server.');
        ws.close();
    });
}

connect();