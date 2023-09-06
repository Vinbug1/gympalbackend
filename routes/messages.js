// messagesController.js
const express = require('express');
const router = express.Router();
const Message = require('../models/message');

// In-memory data store (you should replace this with a real database)
//const messages = [];

router.post('/', async (req, res) => {
    try {
        const { sender, receiver, content } = req.body;
        // Create a new message document
        const message = new Message({ sender, receiver, content });
        // Save the message to the database
        await message.save();
        // Send a successful response with the saved message
        res.status(200).json(message);
      } catch (error) {
        console.error(error);
        // Handle errors, such as validation errors or database connection issues
        //res.status(500).json({ error: 'Internal Server Error' });
        res.status(500).json({ error: 'Internal Server Error', message: error.message });

      }
    });
    
    // GET endpoint to retrieve messages for a specific user
router.get('/:receiverId', async (req, res) => {
  try {
    const { receiverId } = req.params; // Extract receiverId from route parameters

    // Define the condition to find messages where currentUserId matches receiverId
    const condition = { receiver: receiverId };

    // Retrieve messages that match the condition from the database
    const messages = await Message.find(condition);

    // Send a successful response with the retrieved messages
    res.status(200).json(messages);
  } catch (error) {
    console.error(error);
    // Handle errors, such as database connection issues
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});


// Read all messages
router.get('/', (req, res) => {
  res.json(messages);
});

// Read a specific message by ID
router.get('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const message = messages.find((msg) => msg.id === id);
  if (!message) {
    return res.status(404).json({ error: 'Message not found' });
  }
  res.json(message);
});

// Update a message by ID
router.put('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const messageIndex = messages.findIndex((msg) => msg.id === id);
  if (messageIndex === -1) {
    return res.status(404).json({ error: 'Message not found' });
  }
  const { senderId, receiverId, content } = req.body;
  const updatedMessage = new Message(id, senderId, receiverId, content);
  messages[messageIndex] = updatedMessage;
  res.json(updatedMessage);
});

// Delete a message by ID
router.delete('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const messageIndex = messages.findIndex((msg) => msg.id === id);
  if (messageIndex === -1) {
    return res.status(404).json({ error: 'Message not found' });
  }
  const deletedMessage = messages.splice(messageIndex, 1)[0];
  res.json(deletedMessage);
});

module.exports = router;
