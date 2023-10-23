const express = require('express');
const morgan = require('morgan');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http'); // Require http module
//const socketIo = require('./utils/websocket'); // Import the websocket.js file
require('dotenv').config();
// const { Storage } = require('@google-cloud/storage');



// const storage = new Storage({
//   projectId: 'imagekeep-ac687  ', // Replace with your Google Cloud project ID
//   keyFilename: './imagekeep-ac687-firebase-adminsdk-t6lga-032cb2bd96.json', // Replace with your service account key file path
// });

// const Chat = require('../models/chat');
const app = express();
const server = http.createServer(app); // Create an http server
//const server = http.createServer(app); // Create an http server

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('tiny'));

// JWT Authentication
const authJwt = require('./helpers/jwt');
app.use(authJwt());

// Static file serving
//app.use('/public/uploads', express.static(__dirname + '/public/uploads'));
//app.use('files/', express.static(__dirname + 'files/'));

// Error handling
const errorHandler = require('./helpers/error-handler.js');
app.use(errorHandler);

// Routes
const api = process.env.API_URL;
app.use(`${api}/stories`, require('./routes/stories'));
app.use(`${api}/comments`, require('./routes/comments'));
app.use(`${api}/users`, require('./routes/users'));
app.use(`${api}/messages`, require('./routes/messages'));
app.use(`${api}/posts`, require('./routes/posts'));

// Database Connection
mongoose.connect(process.env.CONNECTION_STRING, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  dbName: 'gympal-db',
}).then(() => { console.log('Database Connection is ready...')}).catch((error) => {  console.log(error) });

// Set up WebSocket events
//(server); // Pass the server instance to the WebSocket setup function


// Start the server
const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
