In development. Not production ready. Many things hardcoded.

# _Stream Nexus for Enhanced Entertainment and Discourse_
SNEED (_Stream Nexus for Enhancing Entertainment Discussion_, or _Stream Nexus_ for short) is a combination of userscripts and a Rust webserver to unify the livestream chats of many popular platforms, enabling streamers to multicast more effectively and support alternative tech without sacrificing their community.

Inlining your stream chat on your video enhances the viewer experiences, encourages engagement, promotes community, and provides longevity and replayability to your content by preserving the chat history - even when it is archived or reuploaded to other platforms.

Multicasting is increasingly popular as new platforms emerge and existing platforms become more restrictive. SNEED is a tool to help you multicast more effectively and support alternative tech without dividing your existing viewing base.

Unify, and SNEED!

## Setup

1. Declare the database URL

    ```
    export DATABASE_URL="sqlite:super_chats.db"
    ```

2. Create the database.

    ```
    $ sqlx db create
    ```

3. Run sql migrations

    ```
    $ sqlx migrate run
    ```