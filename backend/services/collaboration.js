/**
 * Real-time Collaboration Service
 * Handles collaborative features like typing indicators, cursor presence, etc.
 */

const logger = require('../utils/logger');

// Store for collaboration state
const collaborationState = {
  typingUsers: new Map(), // Map<incidentId, Set<userId>>
  activeCursors: new Map(), // Map<incidentId, Map<userId, cursorData>>
  onlineUsers: new Map() // Map<userId, Set<socketId>>
};

/**
 * User started typing
 */
function userStartedTyping(io, socket, incidentId) {
  if (!socket.userId) return;
  
  if (!collaborationState.typingUsers.has(incidentId)) {
    collaborationState.typingUsers.set(incidentId, new Set());
  }
  
  collaborationState.typingUsers.get(incidentId).add(socket.userId);
  
  // Broadcast to other users in the incident room
  socket.to(`incident-${incidentId}`).emit('user-typing', {
    userId: socket.userId,
    userName: socket.user?.name,
    incidentId
  });
  
  logger.debug('User started typing', { userId: socket.userId, incidentId });
}

/**
 * User stopped typing
 */
function userStoppedTyping(io, socket, incidentId) {
  if (!socket.userId) return;
  
  const typingSet = collaborationState.typingUsers.get(incidentId);
  if (typingSet) {
    typingSet.delete(socket.userId);
    
    if (typingSet.size === 0) {
      collaborationState.typingUsers.delete(incidentId);
    }
  }
  
  // Broadcast to other users
  socket.to(`incident-${incidentId}`).emit('user-stopped-typing', {
    userId: socket.userId,
    incidentId
  });
  
  logger.debug('User stopped typing', { userId: socket.userId, incidentId });
}

/**
 * Update cursor position
 */
function updateCursorPosition(io, socket, incidentId, cursorData) {
  if (!socket.userId) return;
  
  if (!collaborationState.activeCursors.has(incidentId)) {
    collaborationState.activeCursors.set(incidentId, new Map());
  }
  
  collaborationState.activeCursors.get(incidentId).set(socket.userId, {
    ...cursorData,
    userId: socket.userId,
    userName: socket.user?.name,
    timestamp: Date.now()
  });
  
  // Broadcast to other users
  socket.to(`incident-${incidentId}`).emit('cursor-update', {
    userId: socket.userId,
    userName: socket.user?.name,
    cursor: cursorData,
    incidentId
  });
}

/**
 * Remove cursor when user leaves
 */
function removeCursor(socket, incidentId) {
  if (!socket.userId) return;
  
  const cursorMap = collaborationState.activeCursors.get(incidentId);
  if (cursorMap) {
    cursorMap.delete(socket.userId);
    
    if (cursorMap.size === 0) {
      collaborationState.activeCursors.delete(incidentId);
    }
  }
  
  // Broadcast to others
  socket.to(`incident-${incidentId}`).emit('cursor-left', {
    userId: socket.userId,
    incidentId
  });
}

/**
 * Get active users for an incident
 */
function getActiveUsers(incidentId) {
  const typingSet = collaborationState.typingUsers.get(incidentId);
  const cursorMap = collaborationState.activeCursors.get(incidentId);
  
  const activeUsers = new Set();
  
  if (typingSet) {
    typingSet.forEach(userId => activeUsers.add(userId));
  }
  
  if (cursorMap) {
    cursorMap.forEach((_, userId) => activeUsers.add(userId));
  }
  
  return Array.from(activeUsers);
}

/**
 * Broadcast incident update with collaboration info
 */
function broadcastCollaborativeUpdate(io, incidentId, updateData, updatedBy) {
  const activeUsers = getActiveUsers(incidentId);
  
  io.to(`incident-${incidentId}`).emit('incident-updated', {
    incidentId,
    update: updateData,
    updatedBy: {
      id: updatedBy.id,
      name: updatedBy.name
    },
    activeUsersCount: activeUsers.length,
    timestamp: new Date().toISOString()
  });
}

/**
 * Handle user disconnection
 */
function handleDisconnection(io, socket) {
  if (!socket.userId) return;
  
  // Remove user from all typing states
  for (const [incidentId, typingSet] of collaborationState.typingUsers.entries()) {
    if (typingSet.has(socket.userId)) {
      typingSet.delete(socket.userId);
      socket.to(`incident-${incidentId}`).emit('user-stopped-typing', {
        userId: socket.userId,
        incidentId
      });
    }
  }
  
  // Remove user from all cursor states
  for (const [incidentId, cursorMap] of collaborationState.activeCursors.entries()) {
    if (cursorMap.has(socket.userId)) {
      cursorMap.delete(socket.userId);
      socket.to(`incident-${incidentId}`).emit('cursor-left', {
        userId: socket.userId,
        incidentId
      });
    }
  }
  
  logger.debug('User disconnected from collaboration', { userId: socket.userId });
}

/**
 * Get collaboration state for an incident
 */
function getCollaborationState(incidentId) {
  const typingUsers = collaborationState.typingUsers.get(incidentId);
  const activeCursors = collaborationState.activeCursors.get(incidentId);
  
  return {
    incidentId,
    typingUsers: typingUsers ? Array.from(typingUsers) : [],
    activeCursors: activeCursors ? Array.from(activeCursors.entries()).map(([userId, data]) => ({
      userId,
      ...data
    })) : [],
    activeUsersCount: getActiveUsers(incidentId).length
  };
}

/**
 * Setup collaboration event handlers
 */
function setupCollaborationHandlers(io, socket) {
  // Typing indicators
  socket.on('start-typing', (incidentId) => {
    userStartedTyping(io, socket, incidentId);
  });
  
  socket.on('stop-typing', (incidentId) => {
    userStoppedTyping(io, socket, incidentId);
  });
  
  // Cursor presence
  socket.on('cursor-move', (data) => {
    const { incidentId, x, y, selection } = data;
    updateCursorPosition(io, socket, incidentId, { x, y, selection });
  });
  
  socket.on('cursor-leave', (incidentId) => {
    removeCursor(socket, incidentId);
  });
  
  // Get collaboration state
  socket.on('get-collaboration-state', (incidentId, callback) => {
    const state = getCollaborationState(incidentId);
    callback(state);
  });
  
  // Handle disconnect
  socket.on('disconnect', () => {
    handleDisconnection(io, socket);
  });
}

module.exports = {
  setupCollaborationHandlers,
  broadcastCollaborativeUpdate,
  getCollaborationState,
  getActiveUsers,
  userStartedTyping,
  userStoppedTyping,
  updateCursorPosition,
  removeCursor
};
