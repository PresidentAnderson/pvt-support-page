// Real-time chat functionality with Socket.io
let socket = null;
let currentRoom = null;
let currentUser = null;
let isTyping = false;
let typingTimer = null;

// Initialize Socket.io connection
function initializeChat() {
  if (socket) return; // Already initialized
  
  // Connect to Socket.io server
  socket = io(window.location.origin);
  
  // Socket event handlers
  socket.on('connect', () => {
    console.log('Connected to chat server');
    
    // Join user's personal room if authenticated
    if (currentUser) {
      socket.emit('join-room', `user-${currentUser.id}`);
    }
  });

  socket.on('disconnect', () => {
    console.log('Disconnected from chat server');
  });

  socket.on('new-message', (message) => {
    displayMessage(message);
  });

  socket.on('user-typing', (data) => {
    updateTypingIndicator(data);
  });

  socket.on('error', (error) => {
    console.error('Chat error:', error);
    showToast(error.message || 'Chat connection error', 'error');
  });
}

// Join a chat room
function joinChatRoom(roomId) {
  if (socket && roomId !== currentRoom) {
    // Leave current room
    if (currentRoom) {
      socket.emit('leave-room', currentRoom);
    }
    
    // Join new room
    socket.emit('join-room', roomId);
    currentRoom = roomId;
    
    // Clear chat messages
    const messagesContainer = document.getElementById('chatMessages');
    if (messagesContainer) {
      messagesContainer.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">Loading chat history...</p>';
    }
    
    // Load chat history if it's a ticket room
    if (roomId.startsWith('ticket-')) {
      const ticketId = roomId.replace('ticket-', '');
      loadChatHistory(ticketId);
    }
  }
}

// Load chat history for a ticket
async function loadChatHistory(ticketId) {
  try {
    const response = await api.getChatMessages(ticketId);
    const messagesContainer = document.getElementById('chatMessages');
    
    if (response.success && response.data) {
      messagesContainer.innerHTML = '';
      response.data.forEach(message => displayMessage(message));
    } else {
      messagesContainer.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">No messages yet. Start the conversation!</p>';
    }
  } catch (error) {
    console.error('Failed to load chat history:', error);
  }
}

// Send a chat message
async function sendMessage() {
  const input = document.getElementById('chatInput');
  const message = input.value.trim();
  
  if (!message) return;
  
  // Check if user is authenticated
  if (!currentUser) {
    showToast('Please log in to send messages', 'warning');
    return;
  }
  
  try {
    // Emit to socket for real-time delivery
    socket.emit('chat-message', {
      roomId: currentRoom,
      message: message,
      sender: currentUser.firstName + ' ' + currentUser.lastName,
      type: 'user'
    });
    
    // Clear input
    input.value = '';
    
    // Save to database if it's a ticket chat
    if (currentRoom && currentRoom.startsWith('ticket-')) {
      const ticketId = currentRoom.replace('ticket-', '');
      await api.sendChatMessage({
        ticketId: ticketId,
        roomId: currentRoom,
        message: message,
        type: 'user'
      });
    }
  } catch (error) {
    console.error('Failed to send message:', error);
    showToast('Failed to send message', 'error');
  }
}

// Display a message in the chat window
function displayMessage(message) {
  const messagesContainer = document.getElementById('chatMessages');
  if (!messagesContainer) return;
  
  // Remove "no messages" text if present
  const noMessages = messagesContainer.querySelector('p');
  if (noMessages && noMessages.textContent.includes('No messages')) {
    noMessages.remove();
  }
  
  const messageDiv = document.createElement('div');
  messageDiv.className = `chat-message ${message.type}`;
  messageDiv.style.cssText = `
    margin: 10px 0;
    text-align: ${message.type === 'user' && message.sender === (currentUser?.firstName + ' ' + currentUser?.lastName) ? 'right' : 'left'};
  `;
  
  const messageBubble = document.createElement('span');
  messageBubble.style.cssText = `
    display: inline-block;
    max-width: 70%;
    padding: 10px 15px;
    border-radius: 18px;
    background: ${message.type === 'support' || message.type === 'bot' 
      ? '#f1f3f5' 
      : 'linear-gradient(135deg, var(--primary-blue), var(--secondary-teal))'};
    color: ${message.type === 'support' || message.type === 'bot' ? '#333' : 'white'};
  `;
  
  // Add sender name for support messages
  if (message.type === 'support' || message.type === 'bot') {
    const senderName = document.createElement('div');
    senderName.style.cssText = 'font-size: 0.85rem; opacity: 0.7; margin-bottom: 5px;';
    senderName.textContent = message.sender || 'Support';
    messageBubble.appendChild(senderName);
  }
  
  const messageText = document.createElement('div');
  messageText.textContent = message.message;
  messageBubble.appendChild(messageText);
  
  // Add timestamp
  const timestamp = document.createElement('div');
  timestamp.style.cssText = 'font-size: 0.75rem; opacity: 0.6; margin-top: 5px;';
  timestamp.textContent = new Date(message.timestamp || message.created_at).toLocaleTimeString();
  messageBubble.appendChild(timestamp);
  
  messageDiv.appendChild(messageBubble);
  messagesContainer.appendChild(messageDiv);
  
  // Scroll to bottom
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Handle typing indicators
function handleTyping() {
  if (!socket || !currentRoom || !currentUser) return;
  
  if (!isTyping) {
    isTyping = true;
    socket.emit('typing', {
      roomId: currentRoom,
      userId: currentUser.id,
      isTyping: true
    });
  }
  
  // Clear existing timer
  clearTimeout(typingTimer);
  
  // Set new timer
  typingTimer = setTimeout(() => {
    isTyping = false;
    socket.emit('typing', {
      roomId: currentRoom,
      userId: currentUser.id,
      isTyping: false
    });
  }, 1000);
}

// Update typing indicator
function updateTypingIndicator(data) {
  const indicator = document.getElementById('typingIndicator');
  if (!indicator) return;
  
  if (data.isTyping && data.userId !== currentUser?.id) {
    indicator.style.display = 'block';
    indicator.textContent = 'Support is typing...';
  } else {
    indicator.style.display = 'none';
  }
}

// Initialize chat when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
  // Get current user if authenticated
  if (tokenManager.getToken()) {
    try {
      const response = await api.getCurrentUser();
      if (response.success) {
        currentUser = response.user;
        initializeChat();
      }
    } catch (error) {
      console.error('Failed to get user for chat:', error);
    }
  }
  
  // Set up chat input handlers
  const chatInput = document.getElementById('chatInput');
  if (chatInput) {
    chatInput.addEventListener('keypress', (e) => {
      handleTyping();
      if (e.key === 'Enter') {
        sendMessage();
      }
    });
  }
  
  // Set up send button
  const sendButton = document.querySelector('.send-message');
  if (sendButton) {
    sendButton.addEventListener('click', sendMessage);
  }
});

// Export functions for global use
window.chatFunctions = {
  initializeChat,
  joinChatRoom,
  sendMessage
};