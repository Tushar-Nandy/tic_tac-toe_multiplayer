const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

// Serve static files (HTML, CSS, JS)
app.use(express.static("public"));

/* =========================
   GAME STATE
========================= */
const MAX_MOVES = 4;

let gameState = {
  board: Array(9).fill(null), // 'X' or 'O'
  XMoves: [],
  OMoves: [],
  turn: "X",
  gameOver: false,
  draw: false,
  disappearing: null // index of symbol about to disappear
};

let players = []; // socket IDs for X and O

/* =========================
   HELPER FUNCTIONS
========================= */
function checkWinner(board) {
  const wins = [
    [0,1,2],[3,4,5],[6,7,8], // rows
    [0,3,6],[1,4,7],[2,5,8], // columns
    [0,4,8],[2,4,6]          // diagonals
  ];

  return wins.some(p =>
    board[p[0]] && board[p[0]] === board[p[1]] && board[p[1]] === board[p[2]]
  );
}

function resetGame() {
  gameState = {
    board: Array(9).fill(null),
    XMoves: [],
    OMoves: [],
    turn: "X",
    gameOver: false,
    draw: false,
    disappearing: null
  };
}

/* =========================
   SOCKET CONNECTION
========================= */
io.on("connection", socket => {
  console.log("Connected:", socket.id);

  // Assign role
  let role = "spectator";
  if (players.length === 0) {
    role = "X";
    players.push(socket.id);
  } else if (players.length === 1) {
    role = "O";
    players.push(socket.id);
  }

  // Send role and initial state
  socket.emit("player", role);
  socket.emit("state", gameState);

  /* ---------- MOVE HANDLER ---------- */
  socket.on("move", index => {
    if (gameState.gameOver) return;
    if (gameState.board[index] !== null) return;
    if ((role === "X" && gameState.turn !== "X") ||
        (role === "O" && gameState.turn !== "O")) return;
    if (role === "spectator") return;

    const moves = role === "X" ? gameState.XMoves : gameState.OMoves;

    // Add new move
    moves.push(index);
    gameState.board[index] = role;

    // Check winner first
    if (checkWinner(gameState.board)) {
      gameState.gameOver = true;
      gameState.disappearing = null;
    } else if (!gameState.board.includes(null)) {
      gameState.draw = true;
      gameState.disappearing = null;
    } else {
      // Remove oldest symbol if moves > MAX_MOVES
      if (moves.length > MAX_MOVES) {
        const removed = moves.shift();
        gameState.board[removed] = null;
        gameState.disappearing = removed;
      } else {
        gameState.disappearing = null;
      }

      // Switch turn
      gameState.turn = gameState.turn === "X" ? "O" : "X";
    }

    // Broadcast updated state
    io.emit("state", gameState);
  });

  /* ---------- RESTART HANDLER ---------- */
  socket.on("restart", () => {
    resetGame();
    io.emit("state", gameState);
  });

  /* ---------- DISCONNECT ---------- */
  socket.on("disconnect", () => {
    console.log("Disconnected:", socket.id);
    players = players.filter(id => id !== socket.id);
  });
});

/* =========================
   SERVER START
========================= */
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
