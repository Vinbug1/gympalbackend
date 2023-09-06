const socketIo = require('socket.io');

function setupWebSocket(server) {
  const io = socketIo(server);

  // Create a mapping of connected sockets to user IDs
  const connectedUsers = new Map();

  io.on('connection', (socket) => {
    console.log('A user connected');

    // Handle user connection
    socket.on('userConnect', (userId) => {
      console.log(`User ${userId} connected`);

      // Associate the user's socket with their ID
      connectedUsers.set(userId, socket);

      // Notify all connected users about the new user's connection
      io.emit('userConnected', userId);
    });

    // Handle chat messages
    // socket.on('chatMessage', (message) => {
    //   const { senderId, receiverId, content } = message;
    //   const recipientSocket = connectedUsers.get(receiverId);

    //   if (recipientSocket) {
    //     // Send the message to the recipient's socket
    //     recipientSocket.emit('chatMessage', message);

    //     // Also, send the message to the sender's socket (optional)
    //     socket.emit('chatMessage', message);
    //   }
    // });

    // Handle chat messages
socket.on('chatMessage', (message) => {
  const { senderId, receiverId, content } = message;
  const recipientSocket = connectedUsers.get(receiverId);

  if (recipientSocket) {
    console.log(`Recipient's socket found: ${receiverId}`);
    recipientSocket.emit('chatMessage', message);

    // Also, send the message to the sender's socket (optional)
    socket.emit('chatMessage', message);
  } else {
    console.log(`Recipient's socket not found: ${receiverId}`);
  }
});


    // Handle disconnection
    socket.on('disconnect', () => {
      // Find and remove the socket from the mapping
      for (const [userId, userSocket] of connectedUsers.entries()) {
        if (userSocket === socket) {
          console.log(`User ${userId} disconnected`);
          connectedUsers.delete(userId);

          // Notify all connected users about the user's disconnection
          io.emit('userDisconnected', userId);
          break;
        }
      }
    });
  });
}

module.exports = setupWebSocket;







// const socketIo = require('socket.io');

// function setupWebSocket(server) {
//   const io = socketIo(server);

//   // Create a mapping of connected sockets to user IDs
//   const connectedUsers = new Map();

//   io.on('connection', (socket) => {
//     console.log('A user connected');

//     // Handle user connection
//     socket.on('userConnect', (userId) => {
//       console.log(`User ${userId} connected`);

//       // Associate the user's socket with their ID
//       connectedUsers.set(userId, socket);

//       // Notify all connected users about the new user's connection
//       io.emit('userConnected', userId);
//     });

//     // Handle chat messages
//     // socket.on('chatMessage', (message) => {
//     //   const { senderId, receiverId, content } = message;
//     //   const recipientSocket = connectedUsers.get(receiverId);

//     //   if (recipientSocket) {
//     //     // Send the message to the recipient's socket
//     //     recipientSocket.emit('chatMessage', message);
//     //   }
//     // });

//     socket.on('chatMessage', (message) => {
//       const { senderId, receiverId, content } = message;
//       const recipientSocket = connectedUsers.get(receiverId);

//       if (recipientSocket) {
//         // Send the message to the recipient's socket
//         recipientSocket.emit('chatMessage', message);

//         // Also, send the message to the sender's socket (optional)
//         socket.emit('chatMessage', message);
//       }
//     });


//     // Handle disconnection
//     socket.on('disconnect', () => {
//       // Find and remove the socket from the mapping
//       for (const [userId, userSocket] of connectedUsers.entries()) {
//         if (userSocket === socket) {
//           console.log(`User ${userId} disconnected`);
//           connectedUsers.delete(userId);

//           // Notify all connected users about the user's disconnection
//           io.emit('userDisconnected', userId);
//           break;
//         }
//       }
//     });
//   });
// }

// module.exports = setupWebSocket;
