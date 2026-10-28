const socketIo = require('socket.io');

let io;

function initializeWebSocket(server) {
  io = socketIo(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || '*',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Join user-specific room
    socket.on('join-user-room', (userId) => {
      socket.join(`user-${userId}`);
      console.log(`User ${userId} joined their room`);
    });

    // Join incident-specific room
    socket.on('join-incident-room', (incidentId) => {
      socket.join(`incident-${incidentId}`);
      console.log(`Client joined incident room: ${incidentId}`);
    });

    // Join location-based room for nearby incidents
    socket.on('join-location-room', (location) => {
      const room = `location-${location.lat}-${location.lng}`;
      socket.join(room);
      console.log(`Client joined location room: ${room}`);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
}

// Broadcast incident update to all connected clients
function broadcastIncidentUpdate(incident) {
  if (io) {
    io.emit('incident-update', incident);
  }
}

// Send incident update to specific incident room
function sendIncidentUpdate(incidentId, data) {
  if (io) {
    io.to(`incident-${incidentId}`).emit('incident-update', data);
  }
}

// Send notification to specific user
function sendNotificationToUser(userId, notification) {
  if (io) {
    io.to(`user-${userId}`).emit('notification', notification);
  }
}

// Broadcast alert to all clients
function broadcastAlert(alert) {
  if (io) {
    io.emit('alert', alert);
  }
}

// Send to location-based room
function sendToLocation(lat, lng, data) {
  if (io) {
    io.to(`location-${lat}-${lng}`).emit('location-update', data);
  }
}

// Get io instance
function getIo() {
  return io;
}

module.exports = {
  initializeWebSocket,
  broadcastIncidentUpdate,
  sendIncidentUpdate,
  sendNotificationToUser,
  broadcastAlert,
  sendToLocation,
  getIo
};
