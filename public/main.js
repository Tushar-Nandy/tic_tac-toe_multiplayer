const socket = io();

// UI elements
const buttons = document.getElementsByTagName("button");
const turnDisplay = document.getElementById("turn");
const roleDisplay = document.getElementById("role");
const restartBtn = document.getElementById("restart");

let myRole = null;
let gameState = null;

/* =========================
   SOCKET LISTENERS
========================= */
socket.on("player", role => {
  myRole = role;

  if (role === "spectator") {
    roleDisplay.innerText = "You are spectating";
    roleDisplay.style.color = "gray";
    return;
  }

  roleDisplay.innerText = `You are Player ${role}`;
  roleDisplay.style.fontWeight = "bold";

  if (role === "X") roleDisplay.style.color = "red";
  if (role === "O") roleDisplay.style.color = "blue";
});

socket.on("state", state => {
  gameState = state;
  render(state);
});

/* =========================
   RENDER FUNCTION
========================= */
function render(state) {
  // Hide restart button by default
  restartBtn.style.display = "none";

  for (let i = 0; i < 9; i++) {
    buttons[i].innerText = state.board[i] || "";
    buttons[i].classList.remove("disappear");
  }

  // Highlight disappearing symbol
  if (state.disappearing !== null) {
    buttons[state.disappearing].classList.add("disappear");
  }

  if (state.gameOver) {
    turnDisplay.innerText = `${state.turn} wins!`;
    restartBtn.style.display = "block";
    return;
  }

  if (state.draw) {
    turnDisplay.innerText = "It's a draw!";
    restartBtn.style.display = "block";
    return;
  }

  // Show whose turn
  if (myRole === "spectator") {
    turnDisplay.innerText = `Turn: ${state.turn}`;
  } else if (myRole === state.turn) {
    turnDisplay.innerText = `Your turn (${state.turn})`;
  } else {
    turnDisplay.innerText = `Opponent's turn (${state.turn})`;
  }
}

/* =========================
   USER ACTIONS
========================= */
function handleMove(index) {
  if (myRole === "spectator") return;
  if (gameState.turn !== myRole) return;
  socket.emit("move", index);
}

for (let i = 0; i < buttons.length; i++) {
  buttons[i].addEventListener("click", () => handleMove(i));
}

// Restart button
restartBtn.addEventListener("click", () => {
  socket.emit("restart");
});
