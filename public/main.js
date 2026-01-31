// "http://localhost:3000"

const socket = io();

const buttons = document.querySelectorAll(".box");
const turnDisplay = document.getElementById("turn");
const roleDisplay = document.getElementById("role");
const restartBtn = document.getElementById("restart");

const chatBox = document.getElementById("chat-messages");
const chatInput = document.getElementById("chat-text");
const chatSend = document.getElementById("send-chat");

let myRole = null;
let gameState = null;

socket.on("player", role => {
  myRole = role;
  roleDisplay.innerText =
    role === "spectator" ? "Spectator" : `You are ${role}`;
  roleDisplay.style.color = role === "X" ? "red" : role === "O" ? "blue" : "gray";
});

socket.on("state", state => {
  gameState = state;
  render(state);
});

socket.on("chat", msg => {
  const div = document.createElement("div");
  div.innerText = msg;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
});

function render(state) {
  restartBtn.style.display = "none";

  buttons.forEach((btn, i) => {
    btn.innerText = state.board[i] || "";
    btn.classList.remove("about-to-disappear");
  });

  if (!state.gameOver && state.aboutToDisappear !== null) {
    buttons[state.aboutToDisappear].classList.add("about-to-disappear");
  }

  if (state.gameOver) {
    turnDisplay.innerText = `${state.winner} wins!`;
    restartBtn.style.display = "block";
    return;
  }

  if (state.draw) {
    turnDisplay.innerText = "It's a draw!";
    restartBtn.style.display = "block";
    return;
  }

  turnDisplay.innerText =
    myRole === state.turn ? "Your turn" : `Turn: ${state.turn}`;
}

buttons.forEach((btn, i) => {
  btn.onclick = () => {
    if (myRole === gameState.turn) {
      socket.emit("move", i);
    }
  };
});

restartBtn.onclick = () => socket.emit("restart");

chatSend.onclick = () => {
  if (chatInput.value.trim()) {
    socket.emit("chat", `${myRole}: ${chatInput.value}`);
    chatInput.value = "";
  }
};
