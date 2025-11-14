# Public Chat Room - Peer-to-Peer

A beautiful, peer-to-peer public chat room built with HTML, CSS, and JavaScript. **No backend server required!** Uses WebRTC for direct peer-to-peer communication over the internet.

## Features

- 🌐 **Peer-to-Peer Communication** - Chat with people over the internet using WebRTC
- 💬 **Single Public Room** - One public chat room where everyone can chat together
- 👤 **Username System** - Set your username before joining
- 📝 **Message Limit** - Configurable message limit (default: 50 messages)
- 🔄 **Real-Time Messaging** - Messages are sent directly between peers
- ⏰ **Timestamps** - See when messages were sent
- 🎨 **Responsive Design** - Works on desktop and mobile devices
- 🧹 **Clear Chat** - Remove all messages when needed
- 📊 **Connection Status** - See your connection status and number of connected peers

## How It Works

This chat uses **WebRTC (Web Real-Time Communication)** for peer-to-peer connections:
- Uses **PeerJS** for signaling (free service at `0.peerjs.com`)
- First person to join becomes the "host"
- Other users connect to the host
- Messages are relayed through the host to all peers
- No data goes through a central server (except initial signaling)

## How to Use

1. Open `index.html` in your web browser
2. Enter a username
3. Click "Join Public Chat"
4. Start chatting! Everyone who joins will be in the same public room

## Configuration

You can modify the message limit by editing the `MESSAGE_LIMIT` constant in `script.js`:

```javascript
const MESSAGE_LIMIT = 50; // Change this number to adjust the limit
```

## File Structure

```
chat_room/
├── index.html    # Main HTML structure
├── styles.css    # Styling and layout
├── script.js     # P2P chat functionality
└── README.md     # This file
```

## Browser Compatibility

Works in all modern browsers that support:
- WebRTC API
- ES6 JavaScript features
- CSS Grid and Flexbox

**Note**: Some browsers may require HTTPS for WebRTC to work. For local testing, `localhost` works fine.

## Technical Details

### Peer-to-Peer Architecture

- **Host-based relay**: First person to join becomes the host
- **WebRTC Data Channels**: Direct peer-to-peer data transmission
- **PeerJS Signaling**: Uses free PeerJS signaling server for connection setup
- **STUN servers**: Used for NAT traversal (Google and Twilio STUN servers)
- **Fixed Room ID**: All users join the same public room (`public-chat-room`)

### Connection Flow

1. User enters username and joins
2. First user becomes host (peer ID: `room-public-chat-room`)
3. Subsequent users connect to the host
4. Host relays messages to all connected peers
5. New peers receive message history when joining

## Limitations

- **No persistent storage**: Messages are only stored locally on each device
- **Host dependency**: If the host leaves, others may need to reconnect (new host will be assigned)
- **NAT/Firewall**: Some network configurations may prevent connections
- **Single room only**: Everyone joins the same public chat room

## Privacy & Security

- All messages are sent directly between peers (peer-to-peer)
- No central server stores your messages
- Only initial signaling goes through PeerJS servers
- Messages are not encrypted (consider this for sensitive conversations)
- **Public room**: Everyone can see all messages in the public chat

## Troubleshooting

- **Can't connect?** Check your firewall/NAT settings
- **Messages not appearing?** Ensure you're connected (check connection status)
- **Connection status shows "Disconnected"?** Try refreshing and rejoining
- **HTTPS required**: Some browsers require HTTPS for WebRTC (localhost works without HTTPS)

## Future Improvements

Potential enhancements:
- End-to-end encryption
- File sharing
- Voice/video chat
- Better host migration when host leaves
- Message persistence across sessions
- Private rooms option
