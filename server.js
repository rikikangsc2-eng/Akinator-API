// File: server.js

const express = require('express');
const { Akinator, AkinatorAnswer } = require('@aqul/akinator-api');
const app = express();
const port = 3000;

// Map to store user sessions
const userSessions = new Map();

// Documentation page with FontAwesome icons and complete example responses
app.get('/', (req, res) => {
  res.send(`
    <html>
    <head>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css" />
      <style>
        body { font-family: Arial, sans-serif; background-color: #f4f4f4; color: #333; }
        h1 { color: #007bff; }
        p { font-size: 1.2em; }
        .endpoint { margin: 20px 0; }
        .fa { margin-right: 10px; }
        a { text-decoration: none; color: #007bff; }
        a:hover { text-decoration: underline; }
        .btn { background-color: #28a745; color: white; padding: 10px 15px; border-radius: 5px; }
        pre { background-color: #e9ecef; padding: 15px; border-radius: 5px; }
      </style>
    </head>
    <body>
      <h1><i class="fas fa-gamepad"></i> Akinator Game API Documentation</h1>
      <div class="endpoint">
        <p><i class="fas fa-home"></i> <strong>GET /</strong> - Documentation</p>
      </div>
      <div class="endpoint">
        <p><i class="fas fa-user"></i> <strong>GET /:username/start</strong> - Start a new game</p>
        <p>Example: <a href="/john/start" target="_blank">/john/start</a></p>
        <pre>{
  "message": "Game started for john",
  "question": "Is your character real?",
  "progress": 0
}</pre>
      </div>
      <div class="endpoint">
        <p><i class="fas fa-reply"></i> <strong>GET /:username/answer/:answer</strong> - Answer the question and check if the user won (0-4)</p>
        <p>Example: <a href="/john/answer/0" target="_blank">/john/answer/0</a></p>
        <p><strong>Response (not yet win):</strong></p>
        <pre>{
  "message": "Answered with 1",
  "question": "Is your character a YouTuber?",
  "progress": 20,
  "win": false
}</pre>
        <p><strong>Response (game won):</strong></p>
        <pre>{
  "message": "Congratulations!",
  "win": true,
  "suggestion_name": "John Doe",
  "suggestion_desc": "A famous YouTuber",
  "suggestion_photo": "http://example.com/photo.jpg"
}</pre>
      </div>
      <div class="endpoint">
        <p><i class="fas fa-undo-alt"></i> <strong>GET /:username/cancel</strong> - Cancel last answer</p>
        <p>Example: <a href="/john/cancel" target="_blank">/john/cancel</a></p>
        <pre>{
  "message": "Cancelled the last answer",
  "question": "Is your character real?",
  "progress": 10
}</pre>
      </div>
    </body>
    </html>
  `);
});

// Start a new game
app.get('/:username/start', async (req, res) => {
  const { username } = req.params;
  const region = 'id';
  
  const akinator = new Akinator({ region, childMode: false });
  await akinator.start();
  
  // Save the session
  userSessions.set(username, akinator);
  
  res.json({
    message: `Game started for ${username}`,
    question: akinator.question,
    progress: akinator.progress
  });
});

// Answer a question and check if user won
app.get('/:username/answer/:answer', async (req, res) => {
  const { username, answer } = req.params;
  const akinator = userSessions.get(username);

  if (!akinator) {
    return res.status(404).json({ message: `No game session found for ${username}` });
  }

  // Answer the question
  await akinator.answer(parseInt(answer));

  // Check if the game is won
  if (akinator.isWin) {
    res.json({
      message: 'Congratulations!',
      win: true,
      suggestion_name: akinator.sugestion_name,
      suggestion_desc: akinator.sugestion_desc,
      suggestion_photo: akinator.sugestion_photo
    });
  } else {
    res.json({
      message: `Answered with ${answer}`,
      question: akinator.question,
      progress: akinator.progress,
      win: false
    });
  }
});

// Cancel the last answer
app.get('/:username/cancel', async (req, res) => {
  const { username } = req.params;
  const akinator = userSessions.get(username);

  if (!akinator) {
    return res.status(404).json({ message: `No game session found for ${username}` });
  }

  await akinator.cancelAnswer();
  res.json({
    message: 'Cancelled the last answer',
    question: akinator.question,
    progress: akinator.progress
  });
});

app.listen(port, () => {
  console.log(`Akinator API is running on http://localhost:${port}`);
});
