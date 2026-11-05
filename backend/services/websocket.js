const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const pool = require('../config/database');

let io;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

/**
 * WebSocket authentication middleware
 */
async function authenticateSocket(socket, next) {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization;
    
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }
    
    // Remove 'Bearer ' prefix if present
    const tokenValue = token.startsWith('Bearer ') ? token.slice(7) : token;
    
    // Verify JWT token
    const decoded = jwt.verify(tokenValue, process.env.JWT_SECRET || 'your-secret-key');
    
    // Verify user exists
    const userResult = await pool.query(
      'SELECT id, email, name, role FROM users WHERE id = $1',
      [decoded.userId]
    );
    
    if (userResult.rows.length === 0) {
      return next(new Error('Authentication error: User not found'));
    }
    
    // Attach user to socket
    socket.user = userResult.rows[0];
    socket.userId = userResult.rows[0].id;
    
    logger.info('WebSocket authenticated', {
      socketId: socket.id,
      userId: socket.userId,
      userRole: socket.user.role
    });
    
    next();
  } catch (error) {
    logger.error('WebSocket authentication failed', {
      socketId: socket.id,
      error: error.message
    });
    next(new Error('Authentication error: Invalid token'));
  }
}

function initializeWebSocket(server) {
  io = socketIo(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || '*',
      methods: ['GET', 'POST']
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ['websocket', 'polling']
  });

  // Apply authentication middleware
  io.use(authenticateSocket);

  io.on('connection', (socket) => {
    logger.info('Client connected', {
      socketId: socket.id,
      userId: socket.userId,
      userRole: socket.user?.role
    });

    // Handle connection errors
    socket.on('error', (error) => {
      logger.error('WebSocket error', {
        socketId: socket.id,
        userId: socket.userId,
        error: error.message
      });
    });

    // Join user-specific room (now uses authenticated userId)
    socket.on('join-user-room', (userId) => {
      try {
        // Only allow joining own room or admin can join any
        if (socket.userId !== parseInt(userId) && socket.user?.role !== 'admin') {
          socket.emit('error', { message: 'Unauthorized to join this room' });
          return;
        }
        
        socket.join(`user-${userId}`);
        logger.info('User joined room', { userId, socketId: socket.id, requestBy: socket.userId });
      } catch (error) {
        logger.error('Failed to join user room', {
          userId,
          error: error.message
        });
        socket.emit('error', { message: 'Failed to join room' });
      }
    });

    // Join incident-specific room
    socket.on('join-incident-room', (incidentId) => {
      try {
        socket.join(`incident-${incidentId}`);
        logger.info('Client joined incident room', { incidentId, socketId: socket.id });
      } catch (error) {
        logger.error('Failed to join incident room', {
          incidentId,
          error: error.message
        });
        socket.emit('error', { message: 'Failed to join incident room' });
      }
    });

    // Join location-based room for nearby incidents
    socket.on('join-location-room', (location) => {
      try {
        const room = `location-${location.lat}-${location.lng}`;
        socket.join(room);
        logger.info('Client joined location room', { room, socketId: socket.id });
      } catch (error) {
        logger.error('Failed to join location room', {
          location,
          error: error.message
        });
        socket.emit('error', { message: 'Failed to join location room' });
      }
    });

    // Handle ping/pong for connection health
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: Date.now() });
    });

    // Handle disconnect
    socket.on('disconnect', (reason) => {
      logger.info('Client disconnected', {
        socketId: socket.id,
        reason
      });
    });

    // Handle unexpected disconnection
    socket.on('disconnecting', (reason) => {
      logger.warn('Client disconnecting', {
        socketId: socket.id,
        reason
      });
    });
  });

  // Handle server-level errors
  io.on('error', (error) => {
    logger.error('WebSocket server error', {
      error: error.message,
      stack: error.stack
    });
  });

  logger.info('WebSocket server initialized');
  return io;
}

// Broadcast incident update to all connected clients
function broadcastIncidentUpdate(incident) {
  if (io) {
    try {
      io.emit('incident-update', incident);
      logger.debug('Broadcast incident update', { incidentId: incident.id });
    } catch (error) {
      logger.error('Failed to broadcast incident update', {
        error: error.message,
        incidentId: incident.id
      });
    }
  } else {
    logger.warn('WebSocket not initialized, cannot broadcast incident update');
  }
}

// Send incident update to specific incident room
function sendIncidentUpdate(incidentId, data) {
  if (io) {
    try {
      io.to(`incident-${incidentId}`).emit('incident-update', data);
      logger.debug('Sent incident update to room', { incidentId });
    } catch (error) {
      logger.error('Failed to send incident update', {
        error: error.message,
        incidentId
      });
    }
  }
}

// Send notification to specific user
function sendNotificationToUser(userId, notification) {
  if (io) {
    try {
      io.to(`user-${userId}`).emit('notification', notification);
      logger.debug('Sent notification to user', { userId });
    } catch (error) {
      logger.error('Failed to send notification to user', {
        error: error.message,
        userId
      });
    }
  }
}

// Broadcast alert to all clients
function broadcastAlert(alert) {
  if (io) {
    try {
      io.emit('alert', alert);
      logger.info('Broadcast alert', { alertId: alert.id });
    } catch (error) {
      logger.error('Failed to broadcast alert', {
        error: error.message,
        alertId: alert.id
      });
    }
  }
}

// Send to location-based room
function sendToLocation(lat, lng, data) {
  if (io) {
    try {
      io.to(`location-${lat}-${lng}`).emit('location-update', data);
      logger.debug('Sent to location room', { lat, lng });
    } catch (error) {
      logger.error('Failed to send to location', {
        error: error.message,
        lat,
        lng
      });
    }
  }
}

// Get connection stats
function getConnectionStats() {
  if (!io) {
    return { connected: false, clients: 0 };
  }
  
  return {
    connected: true,
    clients: io.sockets.sockets.size,
    rooms: io.sockets.adapter.rooms.size
  };
}

// Get io instance
function getIo() {
  return io;
}

// Check if WebSocket is initialized
function isInitialized() {
  return io !== undefined;
}

module.exports = {
  initializeWebSocket,
  broadcastIncidentUpdate,
  sendIncidentUpdate,
  sendNotificationToUser,
  broadcastAlert,
  sendToLocation,
  getIo,
  isInitialized,
  getConnectionStats
};
