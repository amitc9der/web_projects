// Configuration
const MESSAGE_LIMIT = 50;
const PUBLIC_ROOM_ID = 'public-chat-room'; // Fixed room ID for everyone
const GIPHY_API_KEY = 'GlVGYHkr3WSBnllca54iNt0yFbjz7L65'; // Public Giphy API key
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_VIDEO_SIZE = 10 * 1024 * 1024; // 10MB

// Security Configuration
const MAX_MESSAGE_LENGTH = 500;
const MAX_USERNAME_LENGTH = 20;
const RATE_LIMIT_MESSAGES = 10; // messages per time window
const RATE_LIMIT_WINDOW = 5000; // 5 seconds
const MAX_MEDIA_SIZE_RECEIVED = MAX_VIDEO_SIZE * 2; // Allow some buffer for received media
const BLOCKED_PEERS_STORAGE_KEY = 'chat-blocked-peers';

// DOM Elements
const usernameSection = document.getElementById('usernameSection');
const chatMain = document.getElementById('chatMain');
const usernameInput = document.getElementById('usernameInput');
const joinBtn = document.getElementById('joinBtn');
const leaveBtn = document.getElementById('leaveBtn');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const messagesContainer = document.getElementById('messagesContainer');
const currentUsername = document.getElementById('currentUsername');
const connectionStatus = document.getElementById('connectionStatus');
const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');

// Media DOM Elements
const gifBtn = document.getElementById('gifBtn');
const imageBtn = document.getElementById('imageBtn');
const videoBtn = document.getElementById('videoBtn');
const imageInput = document.getElementById('imageInput');
const videoInput = document.getElementById('videoInput');
const gifModal = document.getElementById('gifModal');
const closeGifModal = document.getElementById('closeGifModal');
const gifSearchInput = document.getElementById('gifSearchInput');
const gifResults = document.getElementById('gifResults');

// State
let messages = [];
let username = '';
let peer = null;
let connections = new Map(); // Map of peerId -> DataConnection
let myPeerId = null;
let isHost = false;
let hostConnection = null;
let discoveryInterval = null;
let replyingTo = null; // Track which message we're replying to

// Security State
let peerMessageTimestamps = new Map(); // Track message rate per peer
let blockedPeers = new Set(); // Set of blocked peer IDs
let suspiciousActivity = new Map(); // Track suspicious activity per peer

// Initialize
function init() {
    setupEventListeners();
    updateConnectionStatus('disconnected');
    
    // Auto-join the room with a generated username
    autoJoinRoom();
}

function autoJoinRoom() {
    // Username will be generated after we get peer ID
    initializePeer();
}

// Generate random username based on peer ID
function generateRandomUsernameFromPeerId(peerId) {
    const adjectives = ['Swift', 'Brave', 'Clever', 'Mighty', 'Silent', 'Noble', 'Quick', 'Wise', 'Bold', 'Fierce'];
    const nouns = ['Tiger', 'Eagle', 'Wolf', 'Dragon', 'Phoenix', 'Hawk', 'Lion', 'Fox', 'Bear', 'Falcon'];
    
    // Hash the peer ID to get consistent random selection
    let hash = 0;
    for (let i = 0; i < peerId.length; i++) {
        hash = ((hash << 5) - hash) + peerId.charCodeAt(i);
        hash = hash & hash; // Convert to 32bit integer
    }
    
    const adjIndex = Math.abs(hash) % adjectives.length;
    const nounIndex = Math.abs(Math.floor(hash / 10)) % nouns.length;
    
    // Extract last few characters of peer ID for uniqueness
    const suffix = peerId.slice(-4).replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    
    return `${adjectives[adjIndex]}${nouns[nounIndex]}${suffix}`;
}

function setupEventListeners() {
    joinBtn.addEventListener('click', handleJoin);
    leaveBtn.addEventListener('click', handleLeave);
    
    usernameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleJoin();
    });

    sendBtn.addEventListener('click', handleSend);
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    });
    
    // Media event listeners
    gifBtn.addEventListener('click', openGifModal);
    imageBtn.addEventListener('click', () => imageInput.click());
    videoBtn.addEventListener('click', () => videoInput.click());
    closeGifModal.addEventListener('click', closeGifModalHandler);
    
    imageInput.addEventListener('change', handleImageUpload);
    videoInput.addEventListener('change', handleVideoUpload);
    
    // GIF search with debounce
    let searchTimeout;
    gifSearchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        const query = e.target.value.trim();
        if (query.length > 0) {
            searchTimeout = setTimeout(() => searchGifs(query), 500);
        } else {
            gifResults.innerHTML = '<div class="gif-placeholder">Type to search for GIFs</div>';
        }
    });
    
    // Close modal on background click
    gifModal.addEventListener('click', (e) => {
        if (e.target === gifModal) {
            closeGifModalHandler();
        }
    });
}

function handleJoin() {
    const inputUsername = usernameInput.value.trim();
    
    if (inputUsername) {
        username = inputUsername;
    }
    // Username will be auto-generated from peer ID if not set
    
    initializePeer();
}

function initializePeer() {
    updateConnectionStatus('connecting');
    
    // Create a predictable host peer ID for the public room
    // The host ID is: room-{PUBLIC_ROOM_ID}
    const hostPeerId = `room-${PUBLIC_ROOM_ID}`;
    
    // Generate a unique peer ID for this user
    const myId = `${PUBLIC_ROOM_ID}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Try to become the host first (use host ID)
    peer = new Peer(hostPeerId, {
        host: '0.peerjs.com',
        port: 443,
        path: '/',
        secure: true,
        config: {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:global.stun.twilio.com:3478' }
            ]
        }
    });

    peer.on('open', (id) => {
        myPeerId = id;
        console.log('My peer ID is: ' + id);
        
        // Generate username from peer ID if not already set
        if (!username) {
            username = generateRandomUsernameFromPeerId(id);
            console.log('Generated username: ' + username);
        }
        
        // If we got the host ID, we're the host
        if (id === hostPeerId) {
            isHost = true;
            console.log('I am the host for public chat room');
        } else {
            // If we didn't get host ID, try to connect as a client
            isHost = false;
            connectToHost(hostPeerId);
        }
        
        updateConnectionStatus('connected');
        
        // Update username display
        currentUsername.textContent = username;
        messageInput.focus();
        
        // Start discovery process
        startDiscovery();
    });

    peer.on('connection', (conn) => {
        console.log('Received connection from:', conn.peer);
        setupConnection(conn);
    });

    peer.on('error', (err) => {
        console.error('Peer error:', err);
        
        // If host ID is taken, we're a client - create new peer with unique ID
        if (err.type === 'unavailable-id' || err.type === 'socket-error') {
            console.log('Host ID taken, connecting as client...');
            peer.destroy();
            
            // Create new peer with unique ID
            peer = new Peer(myId, {
                host: '0.peerjs.com',
                port: 443,
                path: '/',
                secure: true,
                config: {
                    iceServers: [
                        { urls: 'stun:stun.l.google.com:19302' },
                        { urls: 'stun:global.stun.twilio.com:3478' }
                    ]
                }
            });
            
            peer.on('open', (id) => {
                myPeerId = id;
                
                // Generate username from peer ID if not already set
                if (!username) {
                    username = generateRandomUsernameFromPeerId(id);
                    console.log('Generated username: ' + username);
                }
                
                isHost = false;
                connectToHost(hostPeerId);
                updateConnectionStatus('connected');
                
                currentUsername.textContent = username;
                messageInput.focus();
                startDiscovery();
            });
            
            peer.on('connection', (conn) => {
                setupConnection(conn);
            });
            
            peer.on('error', (e) => {
                if (e.type !== 'peer-unavailable') {
                    console.error('Peer error:', e);
                    updateConnectionStatus('error');
                }
            });
            
            return;
        }
        
        if (err.type === 'peer-unavailable') {
            // This is normal when trying to connect to non-existent peers
            return;
        }
        
        updateConnectionStatus('error');
    });

    peer.on('disconnected', () => {
        updateConnectionStatus('disconnected');
        console.log('Peer disconnected');
    });

    peer.on('close', () => {
        updateConnectionStatus('disconnected');
        console.log('Peer connection closed');
    });
}

function connectToHost(hostId) {
    if (hostConnection || hostId === myPeerId) return;
    
    try {
        const conn = peer.connect(hostId, { reliable: true });
        if (conn) {
            hostConnection = conn;
            setupConnection(conn, true);
        }
    } catch (error) {
        console.error('Error connecting to host:', error);
    }
}

function startDiscovery() {
    // Periodically try to connect to host if we're not connected
    if (discoveryInterval) {
        clearInterval(discoveryInterval);
    }
    
    discoveryInterval = setInterval(() => {
        if (!isHost && !hostConnection) {
            const hostId = `room-${PUBLIC_ROOM_ID}`;
            connectToHost(hostId);
        }
    }, 3000);
}


function connectToPeer(peerId) {
    if (connections.has(peerId) || peerId === myPeerId) {
        return;
    }
    
    try {
        const conn = peer.connect(peerId, {
            reliable: true
        });
        
        if (conn) {
            setupConnection(conn);
        }
    } catch (error) {
        console.error('Error connecting to peer:', error);
    }
}

function setupConnection(conn, isHostConn = false) {
    conn.on('open', () => {
        console.log('Connected to peer:', conn.peer);
        connections.set(conn.peer, conn);
        if (isHostConn) {
            hostConnection = conn;
        }
        updateConnectionStatus('connected');
        
        // Send join message
        sendToPeer(conn.peer, {
            type: 'join',
            username: username,
            peerId: myPeerId
        });
        
        // If we're the host, send peer list
        if (isHost) {
            sendToPeer(conn.peer, {
                type: 'peer-list',
                peers: Array.from(connections.keys()).filter(id => id !== conn.peer)
            });
        }
    });

    conn.on('data', (data) => {
        handlePeerMessage(conn.peer, data);
    });

    conn.on('close', () => {
        console.log('Connection closed with:', conn.peer);
        connections.delete(conn.peer);
        if (isHostConn) {
            hostConnection = null;
        }
        updateConnectionStatus('connected');
    });

    conn.on('error', (err) => {
        console.error('Connection error:', err);
        connections.delete(conn.peer);
        if (isHostConn) {
            hostConnection = null;
        }
    });
}

// Security Functions
function isPeerBlocked(peerId) {
    return blockedPeers.has(peerId);
}

function blockPeer(peerId, reason = 'Suspicious activity') {
    if (isPeerBlocked(peerId)) return;
    
    blockedPeers.add(peerId);
    console.warn(`🚫 Blocked peer ${peerId}: ${reason}`);
    
    // Disconnect from blocked peer
    const conn = connections.get(peerId);
    if (conn) {
        conn.close();
        connections.delete(peerId);
    }
    
    // Show notification to user
    showSecurityWarning(`Blocked a user due to: ${reason}`);
}

function checkRateLimit(peerId) {
    const now = Date.now();
    const timestamps = peerMessageTimestamps.get(peerId) || [];
    
    // Remove old timestamps outside the window
    const recentTimestamps = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW);
    
    // Check if rate limit exceeded
    if (recentTimestamps.length >= RATE_LIMIT_MESSAGES) {
        return false; // Rate limit exceeded
    }
    
    // Add current timestamp
    recentTimestamps.push(now);
    peerMessageTimestamps.set(peerId, recentTimestamps);
    
    return true; // Within rate limit
}

function validateReceivedMessage(data, peerId) {
    // Check if peer is blocked
    if (isPeerBlocked(peerId)) {
        console.warn('Rejected message from blocked peer:', peerId);
        return false;
    }
    
    // Validate data structure
    if (!data || typeof data !== 'object') {
        console.warn('Invalid data structure from peer:', peerId);
        recordSuspiciousActivity(peerId, 'Invalid data structure');
        return false;
    }
    
    // Validate message type
    if (!data.type || typeof data.type !== 'string') {
        console.warn('Invalid message type from peer:', peerId);
        recordSuspiciousActivity(peerId, 'Invalid message type');
        return false;
    }
    
    // Validate message data
    if (data.type === 'message') {
        if (!data.message || typeof data.message !== 'object') {
            console.warn('Invalid message data from peer:', peerId);
            recordSuspiciousActivity(peerId, 'Invalid message data');
            return false;
        }
        
        const msg = data.message;
        
        // Validate username
        if (!msg.username || typeof msg.username !== 'string' || msg.username.length > MAX_USERNAME_LENGTH) {
            console.warn('Invalid username from peer:', peerId);
            recordSuspiciousActivity(peerId, 'Invalid username');
            return false;
        }
        
        // Validate message text length
        if (msg.text && msg.text.length > MAX_MESSAGE_LENGTH * 2) {
            console.warn('Message too long from peer:', peerId);
            recordSuspiciousActivity(peerId, 'Message too long');
            return false;
        }
        
        // Validate message type
        const validTypes = ['text', 'gif', 'image', 'video'];
        if (!validTypes.includes(msg.type)) {
            console.warn('Invalid message type from peer:', peerId);
            recordSuspiciousActivity(peerId, 'Invalid message type');
            return false;
        }
        
        // Validate media data size
        if (msg.imageData) {
            const size = estimateBase64Size(msg.imageData);
            if (size > MAX_MEDIA_SIZE_RECEIVED) {
                console.warn('Image too large from peer:', peerId);
                recordSuspiciousActivity(peerId, 'Oversized image');
                return false;
            }
            // Validate it's actually an image data URL
            if (!msg.imageData.startsWith('data:image/')) {
                console.warn('Invalid image data from peer:', peerId);
                recordSuspiciousActivity(peerId, 'Invalid image data');
                return false;
            }
        }
        
        if (msg.videoData) {
            const size = estimateBase64Size(msg.videoData);
            if (size > MAX_MEDIA_SIZE_RECEIVED) {
                console.warn('Video too large from peer:', peerId);
                recordSuspiciousActivity(peerId, 'Oversized video');
                return false;
            }
            // Validate it's actually a video data URL
            if (!msg.videoData.startsWith('data:video/')) {
                console.warn('Invalid video data from peer:', peerId);
                recordSuspiciousActivity(peerId, 'Invalid video data');
                return false;
            }
        }
        
        // Validate GIF URL
        if (msg.gifUrl && typeof msg.gifUrl !== 'string') {
            console.warn('Invalid GIF URL from peer:', peerId);
            recordSuspiciousActivity(peerId, 'Invalid GIF URL');
            return false;
        }
        
        // Check rate limit
        if (!checkRateLimit(peerId)) {
            console.warn('Rate limit exceeded for peer:', peerId);
            blockPeer(peerId, 'Sending messages too fast (spam detected)');
            return false;
        }
    }
    
    return true;
}

function estimateBase64Size(base64String) {
    if (!base64String) return 0;
    const base64Data = base64String.split(',')[1] || base64String;
    return (base64Data.length * 3) / 4;
}

function recordSuspiciousActivity(peerId, activity) {
    const count = suspiciousActivity.get(peerId) || 0;
    const newCount = count + 1;
    suspiciousActivity.set(peerId, newCount);
    
    // Auto-block after 3 suspicious activities
    if (newCount >= 3) {
        blockPeer(peerId, `Multiple violations: ${activity}`);
    }
}

function showSecurityWarning(message) {
    const warning = document.createElement('div');
    warning.className = 'security-warning';
    warning.innerHTML = `
        <span class="security-icon">🛡️</span>
        <span class="security-message">${escapeHtml(message)}</span>
    `;
    
    // Insert at top of messages container
    const container = messagesContainer.parentElement;
    container.insertBefore(warning, messagesContainer);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        warning.style.opacity = '0';
        setTimeout(() => warning.remove(), 300);
    }, 5000);
}

function handlePeerMessage(peerId, data) {
    // Validate all received messages
    if (!validateReceivedMessage(data, peerId)) {
        console.warn('Rejected invalid message from peer:', peerId);
        return; // Drop invalid messages
    }
    
    if (data.type === 'join') {
        console.log('Peer joined:', data.username);
        
        // If we're the host, broadcast the new peer to others
        if (isHost) {
            // Broadcast new peer to all existing connections
            connections.forEach((conn, pId) => {
                if (pId !== peerId) {
                    sendToPeer(pId, {
                        type: 'peer-joined',
                        peerId: data.peerId,
                        username: data.username
                    });
                }
            });
        }
    } else if (data.type === 'peer-list') {
        // Connect to peers in the list (mesh network)
        if (data.peers && isHost) {
            data.peers.forEach(pId => {
                connectToPeer(pId);
            });
        }
    } else if (data.type === 'peer-joined') {
        // Another peer joined, try to connect to them
        if (data.peerId && data.peerId !== myPeerId) {
            connectToPeer(data.peerId);
        }
    } else if (data.type === 'message') {
        // Regular chat message - already validated
        addMessage(data.message, false);
        
        // If we're the host, relay to all other peers
        if (isHost) {
            connections.forEach((conn, pId) => {
                if (pId !== peerId) {
                    sendToPeer(pId, data);
                }
            });
        } else if (hostConnection && peerId !== hostConnection.peer) {
            // If we're a client and received from non-host, relay to host
            sendToPeer(hostConnection.peer, data);
        }
    }
}

function broadcastMessage(message) {
    const data = {
        type: 'message',
        message: message
    };
    
    if (isHost) {
        // Host broadcasts to all connected peers
        connections.forEach((conn, peerId) => {
            sendToPeer(peerId, data);
        });
    } else if (hostConnection) {
        // Client sends to host, host will relay
        sendToPeer(hostConnection.peer, data);
    }
}

function sendToPeer(peerId, data) {
    const conn = connections.get(peerId);
    if (conn && conn.open) {
        try {
            conn.send(data);
        } catch (error) {
            console.error('Error sending to peer:', error);
        }
    }
}

function handleSend() {
    const messageText = messageInput.value.trim();
    if (!messageText) return;
    if (!username) {
        alert('Please enter a username first');
        return;
    }

    // Auto-clear oldest messages if limit reached
    if (messages.length >= MESSAGE_LIMIT) {
        messages = messages.slice(-(MESSAGE_LIMIT - 1)); // Keep the most recent messages
        renderMessages();
    }

    const message = {
        id: Date.now() + Math.random(),
        username: username,
        text: messageText,
        type: 'text',
        timestamp: new Date().toISOString(),
        replyTo: replyingTo ? {
            id: replyingTo.id,
            username: replyingTo.username,
            text: replyingTo.text || replyingTo.gifUrl || replyingTo.imageData || replyingTo.videoData ? 'Media' : '',
            type: replyingTo.type
        } : null
    };

    addMessage(message, true);
    messageInput.value = '';
    cancelReply();
    messageInput.focus();
}

// GIF Modal Functions
function openGifModal() {
    gifModal.style.display = 'flex';
    gifSearchInput.value = '';
    gifResults.innerHTML = '<div class="gif-placeholder">Type to search for GIFs</div>';
    setTimeout(() => gifSearchInput.focus(), 100);
}

function closeGifModalHandler() {
    gifModal.style.display = 'none';
}

async function searchGifs(query) {
    try {
        gifResults.innerHTML = '<div class="gif-placeholder">Searching...</div>';
        
        const response = await fetch(
            `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(query)}&limit=20&rating=g`
        );
        
        if (!response.ok) throw new Error('Failed to fetch GIFs');
        
        const data = await response.json();
        
        if (data.data.length === 0) {
            gifResults.innerHTML = '<div class="gif-placeholder">No GIFs found</div>';
            return;
        }
        
        gifResults.innerHTML = data.data.map(gif => `
            <div class="gif-item" onclick="selectGif('${gif.images.fixed_height.url}', '${escapeHtml(gif.title)}')">
                <img src="${gif.images.fixed_height_small.url}" alt="${escapeHtml(gif.title)}">
            </div>
        `).join('');
    } catch (error) {
        console.error('Error searching GIFs:', error);
        gifResults.innerHTML = '<div class="gif-placeholder">Error loading GIFs. Please try again.</div>';
    }
}

function selectGif(gifUrl, title) {
    // Auto-clear oldest messages if limit reached
    if (messages.length >= MESSAGE_LIMIT) {
        messages = messages.slice(-(MESSAGE_LIMIT - 1));
        renderMessages();
    }
    
    const message = {
        id: Date.now() + Math.random(),
        username: username,
        type: 'gif',
        gifUrl: gifUrl,
        text: title || 'GIF',
        timestamp: new Date().toISOString(),
        replyTo: replyingTo ? {
            id: replyingTo.id,
            username: replyingTo.username,
            text: replyingTo.text || replyingTo.gifUrl || replyingTo.imageData || replyingTo.videoData ? 'Media' : '',
            type: replyingTo.type
        } : null
    };
    
    addMessage(message, true);
    cancelReply();
    closeGifModalHandler();
}

// Image Upload
async function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file');
        imageInput.value = '';
        return;
    }
    
    // Validate file size
    if (file.size > MAX_IMAGE_SIZE) {
        alert(`Image size must be less than ${MAX_IMAGE_SIZE / (1024 * 1024)}MB`);
        imageInput.value = '';
        return;
    }
    
    // Auto-clear oldest messages if limit reached
    if (messages.length >= MESSAGE_LIMIT) {
        messages = messages.slice(-(MESSAGE_LIMIT - 1));
        renderMessages();
    }
    
    try {
        const base64 = await fileToBase64(file);
        
        const message = {
            id: Date.now() + Math.random(),
            username: username,
            type: 'image',
            imageData: base64,
            text: file.name,
            timestamp: new Date().toISOString(),
            replyTo: replyingTo ? {
                id: replyingTo.id,
                username: replyingTo.username,
                text: replyingTo.text || replyingTo.gifUrl || replyingTo.imageData || replyingTo.videoData ? 'Media' : '',
                type: replyingTo.type
            } : null
        };
        
        addMessage(message, true);
        cancelReply();
        imageInput.value = '';
    } catch (error) {
        console.error('Error uploading image:', error);
        alert('Failed to upload image. Please try again.');
        imageInput.value = '';
    }
}

// Video Upload
async function handleVideoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('video/')) {
        alert('Please select a valid video file');
        videoInput.value = '';
        return;
    }
    
    // Validate file size
    if (file.size > MAX_VIDEO_SIZE) {
        alert(`Video size must be less than ${MAX_VIDEO_SIZE / (1024 * 1024)}MB`);
        videoInput.value = '';
        return;
    }
    
    // Auto-clear oldest messages if limit reached
    if (messages.length >= MESSAGE_LIMIT) {
        messages = messages.slice(-(MESSAGE_LIMIT - 1));
        renderMessages();
    }
    
    try {
        const base64 = await fileToBase64(file);
        
        const message = {
            id: Date.now() + Math.random(),
            username: username,
            type: 'video',
            videoData: base64,
            text: file.name,
            timestamp: new Date().toISOString(),
            replyTo: replyingTo ? {
                id: replyingTo.id,
                username: replyingTo.username,
                text: replyingTo.text || replyingTo.gifUrl || replyingTo.imageData || replyingTo.videoData ? 'Media' : '',
                type: replyingTo.type
            } : null
        };
        
        addMessage(message, true);
        cancelReply();
        videoInput.value = '';
    } catch (error) {
        console.error('Error uploading video:', error);
        alert('Failed to upload video. Please try again.');
        videoInput.value = '';
    }
}

// Utility: Convert file to base64
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function addMessage(message, broadcast = true) {
    // Avoid duplicates
    if (messages.find(m => m.id === message.id)) {
        return;
    }
    
    messages.push(message);
    
    // Enforce message limit
    if (messages.length > MESSAGE_LIMIT) {
        messages = messages.slice(-MESSAGE_LIMIT);
    }
    
    renderMessages();
    updateMessageCount();
    
    // Broadcast to all connected peers
    if (broadcast) {
        broadcastMessage(message);
    }
}

function renderMessages() {
    if (messages.length === 0) {
        messagesContainer.innerHTML = '<div class="empty-state">No messages yet. Start the conversation! Everyone in the public chat room will see your messages.</div>';
        return;
    }

    messagesContainer.innerHTML = messages.map(msg => {
        const isOwn = msg.username === username;
        const time = formatTime(msg.timestamp);
        
        let mediaContent = '';
        let textContent = '';
        let replyContent = '';
        
        // Render reply context if present
        if (msg.replyTo) {
            const replyText = msg.replyTo.type === 'text' ? escapeHtml(msg.replyTo.text) : 
                             msg.replyTo.type === 'gif' ? '🎞️ GIF' :
                             msg.replyTo.type === 'image' ? '🖼️ Image' :
                             msg.replyTo.type === 'video' ? '🎬 Video' : 'Media';
            replyContent = `
                <div class="message-reply-context">
                    <div class="reply-indicator"></div>
                    <div class="reply-content">
                        <div class="reply-username">${escapeHtml(msg.replyTo.username)}</div>
                        <div class="reply-text">${replyText}</div>
                    </div>
                </div>
            `;
        }
        
        // Render based on message type
        switch(msg.type) {
            case 'gif':
                mediaContent = `<div class="message-media"><img src="${msg.gifUrl}" alt="${escapeHtml(msg.text)}" class="media-gif"></div>`;
                textContent = '';
                break;
            
            case 'image':
                mediaContent = `<div class="message-media"><img src="${msg.imageData}" alt="${escapeHtml(msg.text)}"></div>`;
                textContent = msg.text ? `<div class="message-content">${escapeHtml(msg.text)}</div>` : '';
                break;
            
            case 'video':
                mediaContent = `<div class="message-media"><video controls><source src="${msg.videoData}"></video></div>`;
                textContent = msg.text ? `<div class="message-content">${escapeHtml(msg.text)}</div>` : '';
                break;
            
            case 'text':
            default:
                textContent = `<div class="message-content">${escapeHtml(msg.text)}</div>`;
                break;
        }
        
        return `
            <div class="message ${isOwn ? 'own' : 'other'}" data-message-id="${msg.id}">
                <div class="message-header">
                    <span class="message-username">${escapeHtml(msg.username)}</span>
                    <span class="message-time">${time}</span>
                    <button class="reply-btn" onclick="setReplyTo('${msg.id}')" title="Reply">↩</button>
                </div>
                ${replyContent}
                ${textContent}
                ${mediaContent}
            </div>
        `;
    }).join('');

    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (seconds < 60) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function updateMessageCount() {
    // Update UI based on limit (no longer blocks, just warns)
    if (messages.length >= MESSAGE_LIMIT) {
        showLimitWarning(true);
    } else if (messages.length >= MESSAGE_LIMIT * 0.8) {
        showLimitWarning(false);
    } else {
        hideLimitWarning();
    }
}

function showLimitWarning(reached) {
    let warning = document.getElementById('limitWarning');
    if (!warning) {
        warning = document.createElement('div');
        warning.id = 'limitWarning';
        chatMain.insertBefore(warning, messagesContainer);
    }
    
    if (reached) {
        warning.className = 'limit-warning limit-reached';
        warning.textContent = `Message limit reached! Oldest messages will be auto-cleared.`;
    } else {
        warning.className = 'limit-warning';
        warning.textContent = `Warning: Approaching message limit (${messages.length}/${MESSAGE_LIMIT})`;
    }
}

function hideLimitWarning() {
    const warning = document.getElementById('limitWarning');
    if (warning) {
        warning.remove();
    }
}

function handleLeave() {
    if (confirm('Leave the chat room? You will rejoin with a new username.')) {
        // Stop discovery
        if (discoveryInterval) {
            clearInterval(discoveryInterval);
            discoveryInterval = null;
        }
        
        // Close all connections
        connections.forEach((conn) => {
            conn.close();
        });
        connections.clear();
        hostConnection = null;
        
        // Close peer connection
        if (peer) {
            peer.destroy();
            peer = null;
        }
        
        // Reset state
        messages = [];
        myPeerId = null;
        isHost = false;
        
        // Clear messages
        messagesContainer.innerHTML = '';
        updateConnectionStatus('disconnected');
        updateMessageCount();
        
        // Auto-rejoin with new username
        autoJoinRoom();
    }
}

function updateConnectionStatus(status) {
    statusDot.className = 'status-dot';
    
    switch(status) {
        case 'connected':
            statusDot.classList.add('connected');
            statusText.textContent = `Connected (${connections.size} peer${connections.size !== 1 ? 's' : ''})`;
            break;
        case 'connecting':
            statusDot.classList.add('connecting');
            statusText.textContent = 'Connecting...';
            break;
        case 'error':
            statusDot.style.background = '#dc3545';
            statusText.textContent = 'Error';
            break;
        default:
            statusText.textContent = 'Disconnected';
    }
}

// Reply functionality
function setReplyTo(messageId) {
    const message = messages.find(m => m.id == messageId);
    if (!message) return;
    
    replyingTo = message;
    showReplyBanner();
}

function cancelReply() {
    replyingTo = null;
    hideReplyBanner();
}

function showReplyBanner() {
    let banner = document.getElementById('replyBanner');
    if (!banner) {
        banner = document.createElement('div');
        banner.id = 'replyBanner';
        banner.className = 'reply-banner';
        
        const inputContainer = messageInput.parentElement;
        inputContainer.insertBefore(banner, messageInput);
    }
    
    const replyText = replyingTo.type === 'text' ? replyingTo.text : 
                     replyingTo.type === 'gif' ? '🎞️ GIF' :
                     replyingTo.type === 'image' ? '🖼️ Image' :
                     replyingTo.type === 'video' ? '🎬 Video' : 'Media';
    
    banner.innerHTML = `
        <div class="reply-banner-content">
            <div class="reply-banner-text">
                <strong>Replying to ${escapeHtml(replyingTo.username)}</strong>
                <span class="reply-preview">${escapeHtml(replyText.substring(0, 50))}${replyText.length > 50 ? '...' : ''}</span>
            </div>
            <button class="reply-cancel-btn" onclick="cancelReply()">✕</button>
        </div>
    `;
    banner.style.display = 'flex';
    messageInput.focus();
}

function hideReplyBanner() {
    const banner = document.getElementById('replyBanner');
    if (banner) {
        banner.style.display = 'none';
    }
}

// Make functions globally accessible for onclick handlers
window.setReplyTo = setReplyTo;
window.cancelReply = cancelReply;
window.selectGif = selectGif;

// Initialize on page load
init();
