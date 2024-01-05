// socketManager.js
const socketIo = require('socket.io');

let io;
let globalSocket; // Store the socket globally
let socketInitializedCallback;

function init(server) {
  io = socketIo(server, {
    pingTimeout: 60000,
    cors: {
      origin: "http://localhost:3000",
    }
  });

  io.on('connection', (socket) => {
    console.log('A user connected');

    // Handle the "setup" event
    socket.on("setup", (userData) => {
      socket.join(userData);
      console.log("userData", userData);
      socket.emit("connected");
    });

    // Add more Socket.IO event handlers here

    socket.on('disconnect', () => {
      console.log('User disconnected');
    });

    // Store the socket globally
    globalSocket = socket;

    // Execute the callback when the socket is initialized
    if (socketInitializedCallback) {
      socketInitializedCallback();
    }
  });
}

function getIo() {
  if (!io) {
    throw new Error('Socket.IO has not been initialized');
  }
  return io;
}

function getGlobalSocket() {
  if (!globalSocket) {
    throw new Error('Socket has not been initialized');
  }
  return globalSocket;
}

function onSocketInitialized(callback) {
  // Set the callback to be executed when the socket is initialized
  socketInitializedCallback = callback;
}

module.exports = {
  init,
  getIo,
  getGlobalSocket,
  onSocketInitialized,
};
