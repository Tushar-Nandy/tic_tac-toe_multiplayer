const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

const MAX_MOVES = 4;

let players = [];

let gameState = {
  board: Array(9).fill(null),
  XMoves: [],
  OMoves: [],
  turn: "X",
  gameOver: false,
  draw: false,
  winner: null,
  aboutToDisappear: null
};

function checkWinner(board) {
  const wins = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];
  return wins.some(p =>
    board[p[0]] &&
    board[p[0]] === board[p[1]] &&
    board[p[1]] === board[p[2]]
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
    winner: null,
    aboutToDisappear: null
  };
}

io.on("connection", socket => {
  let role = "spectator";

  if (players.length === 0) {
    role = "X";
    players.push(socket.id);
  } else if (players.length === 1) {
    role = "O";
    players.push(socket.id);
  }

  socket.emit("player", role);
  socket.emit("state", gameState);

  socket.on("move", index => {
    if (gameState.gameOver) return;
    if (gameState.board[index] !== null) return;
    if (role !== gameState.turn) return;
    if (role === "spectator") return;

    const moves = role === "X" ? gameState.XMoves : gameState.OMoves;

    // 1️⃣ Place move
    moves.push(index);
    gameState.board[index] = role;

    // 2️⃣ Check win immediately
    if (checkWinner(gameState.board)) {
      gameState.gameOver = true;
      gameState.winner = role;
      gameState.aboutToDisappear = null;
      io.emit("state", gameState);
      return;
    }

    // 3️⃣ Check draw
    if (!gameState.board.includes(null)) {
      gameState.draw = true;
      gameState.aboutToDisappear = null;
      io.emit("state", gameState);
      return;
    }

    // 4️⃣ Preview disappearing move
    if (moves.length === MAX_MOVES) {
      gameState.aboutToDisappear = moves[0];
    } else {
      gameState.aboutToDisappear = null;
    }

    // 5️⃣ Remove oldest if exceeded
    if (moves.length > MAX_MOVES) {
      const removed = moves.shift();
      gameState.board[removed] = null;
    }

    // 6️⃣ Switch turn
    gameState.turn = gameState.turn === "X" ? "O" : "X";

    io.emit("state", gameState);
  });

  socket.on("chat", msg => {
    io.emit("chat", msg);
  });

  socket.on("restart", () => {
    resetGame();
    io.emit("state", gameState);
  });

  socket.on("disconnect", () => {
    players = players.filter(id => id !== socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () =>
  console.log(`Server running on port ${PORT}`)
);
