const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const screens = {
  menu: document.getElementById("mainMenu"),
  game: document.getElementById("gameScreen"),
  results: document.getElementById("resultsScreen"),
};

const dialogueModal = document.getElementById("dialogueModal");
const challengeModal = document.getElementById("challengeModal");
const feedbackModal = document.getElementById("feedbackModal");
const talkButton = document.getElementById("talkButton");
const toast = document.getElementById("toast");

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {
      // The game still runs from plain files; offline install needs a browser-served copy.
    });
  });
}

const quests = [
  {
    npc: "Lina",
    icon: "!",
    color: "#ffdd57",
    x: 430,
    y: 320,
    topic: "Addition",
    goal: "Find Lina",
    dialogue: "My garden signs blew away. Can you count how many flowers I planted before the festival starts?",
    problem: "Lina planted 8 red flowers and 5 blue flowers. How many flowers did she plant in all?",
    answers: [11, 12, 13, 15],
    correct: 13,
    hint: "Put 8 in your head, then count 5 more.",
  },
  {
    npc: "Bo",
    icon: "!",
    color: "#65d6ff",
    x: 720,
    y: 360,
    topic: "Subtraction",
    goal: "Find Bo",
    dialogue: "I was stacking blocks for a bridge, but some rolled away. Help me figure out what is left.",
    problem: "Bo had 24 blocks. He used 9 for the bridge. How many blocks are left?",
    answers: [13, 14, 15, 16],
    correct: 15,
    hint: "Break 9 into 4 and 5: 24 - 4 - 5.",
  },
  {
    npc: "Mira",
    icon: "!",
    color: "#ff9ab3",
    x: 1040,
    y: 230,
    topic: "Multiplication",
    goal: "Find Mira",
    dialogue: "My bakery trays are ready. I need a quick count before the hungry crowd arrives.",
    problem: "Mira has 6 trays with 4 muffins on each tray. How many muffins are there?",
    answers: [20, 22, 24, 28],
    correct: 24,
    hint: "Think of 6 groups of 4.",
  },
  {
    npc: "Tavi",
    icon: "!",
    color: "#b390ff",
    x: 1260,
    y: 560,
    topic: "Division",
    goal: "Find Tavi",
    dialogue: "I found shiny crystals and want every teammate to get the same amount.",
    problem: "Tavi has 45 crystals to share equally among 5 friends. How many crystals does each friend get?",
    answers: [8, 9, 10, 11],
    correct: 9,
    hint: "Find the number that times 5 makes 45.",
  },
  {
    npc: "Nia",
    icon: "!",
    color: "#70e4ad",
    x: 1560,
    y: 430,
    topic: "Multi-Step",
    goal: "Find Nia",
    dialogue: "My shop orders came in batches. Can you help me check the final total?",
    problem: "Nia packed 3 boxes with 12 apples each, then sold 7 apples. How many apples remain?",
    answers: [27, 29, 31, 36],
    correct: 29,
    hint: "First multiply the boxes, then subtract the sold apples.",
  },
  {
    npc: "Orin",
    icon: "!",
    color: "#ff8c42",
    x: 1820,
    y: 250,
    topic: "Challenge",
    goal: "Find Orin",
    dialogue: "The final gate needs a math code. Solve it, and the whole village opens for celebration.",
    problem: "The gate code is double 18 plus half of 14. What is the code?",
    answers: [40, 43, 46, 50],
    correct: 43,
    hint: "Double 18 first. Half of 14 is a smaller add-on.",
  },
];

const world = {
  width: 2100,
  height: 900,
  tile: 48,
};

const player = {
  x: 220,
  y: 410,
  r: 18,
  speed: 190,
  dirX: 0,
  dirY: 0,
};

const state = {
  started: false,
  paused: false,
  questIndex: 0,
  score: 0,
  correct: 0,
  incorrect: 0,
  hints: 0,
  completed: 0,
  activeNpc: null,
  lastTime: 0,
  rewardUnlocked: localStorage.getItem("mathquestRewardUnlocked") === "true",
};

const keys = new Set();
let toastTimer = 0;
let pendingFeedback = null;

const objects = [
  { type: "house", x: 170, y: 140, w: 130, h: 110, roof: "#dd6553", wall: "#ffe08a" },
  { type: "house", x: 610, y: 120, w: 145, h: 118, roof: "#7a61d1", wall: "#e7d5ff" },
  { type: "house", x: 1110, y: 105, w: 150, h: 120, roof: "#ef8a45", wall: "#ffd7a1" },
  { type: "house", x: 1580, y: 640, w: 150, h: 118, roof: "#3584cf", wall: "#bee7ff" },
  { type: "tree", x: 90, y: 540 }, { type: "tree", x: 330, y: 660 }, { type: "tree", x: 560, y: 505 },
  { type: "tree", x: 920, y: 660 }, { type: "tree", x: 1390, y: 170 }, { type: "tree", x: 1710, y: 150 },
  { type: "tree", x: 1930, y: 620 }, { type: "tree", x: 1310, y: 735 }, { type: "tree", x: 810, y: 180 },
  { type: "well", x: 920, y: 390 }, { type: "crate", x: 500, y: 390 }, { type: "crate", x: 1460, y: 500 },
];

function resizeCanvas() {
  const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));
  canvas.width = Math.floor(window.innerWidth * dpr);
  canvas.height = Math.floor(window.innerHeight * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function showScreen(name) {
  Object.values(screens).forEach((screen) => screen.classList.add("hidden"));
  screens[name].classList.remove("hidden");
}

function resetGame() {
  player.x = 220;
  player.y = 410;
  state.questIndex = 0;
  state.score = 0;
  state.correct = 0;
  state.incorrect = 0;
  state.hints = 0;
  state.completed = 0;
  state.activeNpc = null;
  state.paused = false;
  updateHud();
}

function startGame() {
  resetGame();
  state.started = true;
  showScreen("game");
  showToast(state.rewardUnlocked ? "Golden Scholar Cape equipped. Find Lina!" : "Find Lina. NPCs with ! have quests.");
}

function getCamera() {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  return {
    x: clamp(player.x - vw / 2, 0, Math.max(0, world.width - vw)),
    y: clamp(player.y - vh / 2, 0, Math.max(0, world.height - vh)),
  };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function updateHud() {
  document.getElementById("questText").textContent = `${Math.min(state.questIndex + 1, quests.length)} / ${quests.length}`;
  document.getElementById("scoreText").textContent = state.score;
  document.getElementById("goalText").textContent = state.questIndex < quests.length ? quests[state.questIndex].goal : "Final Results";
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.remove("hidden");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.add("hidden"), 2300);
}

function drawWorld() {
  const cam = getCamera();
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  ctx.clearRect(0, 0, vw, vh);
  ctx.save();
  ctx.translate(-cam.x, -cam.y);

  ctx.fillStyle = "#75d56f";
  ctx.fillRect(0, 0, world.width, world.height);

  drawPaths();
  drawFlowers();
  objects.forEach(drawObject);
  quests.forEach((quest, index) => drawNpc(quest, index));
  drawPlayer();

  ctx.restore();
}

function drawPaths() {
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = "#e7c475";
  ctx.lineWidth = 58;
  ctx.beginPath();
  ctx.moveTo(80, 430);
  ctx.bezierCurveTo(360, 300, 520, 470, 760, 370);
  ctx.bezierCurveTo(1050, 245, 1190, 390, 1360, 560);
  ctx.bezierCurveTo(1550, 720, 1690, 440, 2010, 310);
  ctx.stroke();

  ctx.strokeStyle = "#f2d994";
  ctx.lineWidth = 34;
  ctx.stroke();
}

function drawFlowers() {
  for (let i = 0; i < 42; i += 1) {
    const x = 80 + ((i * 173) % 1930);
    const y = 80 + ((i * 97) % 730);
    if (Math.abs(y - 430) < 42) continue;
    ctx.fillStyle = i % 2 ? "#ff6d8d" : "#fff07a";
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawObject(obj) {
  if (obj.type === "house") {
    ctx.fillStyle = obj.wall;
    ctx.fillRect(obj.x, obj.y + 38, obj.w, obj.h - 38);
    ctx.fillStyle = obj.roof;
    ctx.beginPath();
    ctx.moveTo(obj.x - 12, obj.y + 44);
    ctx.lineTo(obj.x + obj.w / 2, obj.y);
    ctx.lineTo(obj.x + obj.w + 12, obj.y + 44);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#7a5136";
    ctx.fillRect(obj.x + obj.w / 2 - 14, obj.y + obj.h - 38, 28, 38);
    ctx.fillStyle = "#87cffd";
    ctx.fillRect(obj.x + 18, obj.y + 58, 28, 24);
    ctx.fillRect(obj.x + obj.w - 46, obj.y + 58, 28, 24);
    return;
  }

  if (obj.type === "tree") {
    ctx.fillStyle = "#8a5a35";
    ctx.fillRect(obj.x - 8, obj.y + 14, 16, 36);
    ctx.fillStyle = "#267c45";
    ctx.beginPath();
    ctx.arc(obj.x, obj.y, 32, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#38a857";
    ctx.beginPath();
    ctx.arc(obj.x - 17, obj.y + 4, 20, 0, Math.PI * 2);
    ctx.arc(obj.x + 18, obj.y - 2, 22, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  if (obj.type === "well") {
    ctx.fillStyle = "#8ba0ad";
    ctx.fillRect(obj.x - 26, obj.y - 14, 52, 34);
    ctx.fillStyle = "#596c78";
    ctx.fillRect(obj.x - 30, obj.y - 22, 60, 12);
    return;
  }

  ctx.fillStyle = "#b9773e";
  ctx.fillRect(obj.x - 20, obj.y - 18, 40, 36);
  ctx.strokeStyle = "#7a4a2c";
  ctx.lineWidth = 3;
  ctx.strokeRect(obj.x - 20, obj.y - 18, 40, 36);
}

function drawNpc(quest, index) {
  const locked = index > state.questIndex;
  const completed = index < state.questIndex;
  ctx.globalAlpha = locked ? 0.38 : 1;

  ctx.fillStyle = "rgba(0,0,0,0.15)";
  ctx.beginPath();
  ctx.ellipse(quest.x, quest.y + 24, 24, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = quest.color;
  ctx.beginPath();
  ctx.arc(quest.x, quest.y - 8, 19, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#2d5165";
  ctx.fillRect(quest.x - 17, quest.y + 12, 34, 34);
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(quest.x - 7, quest.y - 11, 3, 0, Math.PI * 2);
  ctx.arc(quest.x + 7, quest.y - 11, 3, 0, Math.PI * 2);
  ctx.fill();

  if (!completed) {
    ctx.fillStyle = locked ? "#607383" : "#ffd43b";
    ctx.beginPath();
    ctx.arc(quest.x + 25, quest.y - 48, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = locked ? "#dbe4ea" : "#573400";
    ctx.font = "900 23px system-ui";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(locked ? "•" : quest.icon, quest.x + 25, quest.y - 49);
  } else {
    ctx.fillStyle = "#21b26b";
    ctx.font = "900 24px system-ui";
    ctx.textAlign = "center";
    ctx.fillText("✓", quest.x + 25, quest.y - 40);
  }

  ctx.fillStyle = "#17324a";
  ctx.font = "800 15px system-ui";
  ctx.textAlign = "center";
  ctx.fillText(quest.npc, quest.x, quest.y + 65);
  ctx.globalAlpha = 1;
}

function drawPlayer() {
  ctx.fillStyle = "rgba(0,0,0,0.18)";
  ctx.beginPath();
  ctx.ellipse(player.x, player.y + 22, 22, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  if (state.rewardUnlocked) {
    ctx.fillStyle = "#f6bd2f";
    ctx.beginPath();
    ctx.moveTo(player.x - 14, player.y + 5);
    ctx.lineTo(player.x + 14, player.y + 5);
    ctx.lineTo(player.x + 23, player.y + 43);
    ctx.lineTo(player.x - 23, player.y + 43);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#b97700";
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  ctx.fillStyle = "#2f80ed";
  ctx.fillRect(player.x - 14, player.y + 1, 28, 33);
  ctx.fillStyle = "#ffd5a5";
  ctx.beginPath();
  ctx.arc(player.x, player.y - 12, 17, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#51331e";
  ctx.fillRect(player.x - 16, player.y - 24, 32, 10);
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(player.x - 6, player.y - 12, 3, 0, Math.PI * 2);
  ctx.arc(player.x + 6, player.y - 12, 3, 0, Math.PI * 2);
  ctx.fill();
}

function movePlayer(delta) {
  if (state.paused) return;
  let x = player.dirX;
  let y = player.dirY;

  if (keys.has("ArrowUp") || keys.has("w")) y -= 1;
  if (keys.has("ArrowDown") || keys.has("s")) y += 1;
  if (keys.has("ArrowLeft") || keys.has("a")) x -= 1;
  if (keys.has("ArrowRight") || keys.has("d")) x += 1;

  const len = Math.hypot(x, y) || 1;
  player.x = clamp(player.x + (x / len) * player.speed * delta, 35, world.width - 35);
  player.y = clamp(player.y + (y / len) * player.speed * delta, 65, world.height - 55);
}

function updateInteraction() {
  if (state.questIndex >= quests.length || state.paused) {
    talkButton.classList.add("hidden");
    state.activeNpc = null;
    return;
  }

  const quest = quests[state.questIndex];
  const distance = Math.hypot(player.x - quest.x, player.y - quest.y);
  if (distance < 86) {
    state.activeNpc = quest;
    talkButton.classList.remove("hidden");
  } else {
    state.activeNpc = null;
    talkButton.classList.add("hidden");
  }
}

function openDialogue() {
  if (!state.activeNpc) return;
  state.paused = true;
  talkButton.classList.add("hidden");
  const quest = state.activeNpc;
  document.getElementById("dialogueName").textContent = quest.npc;
  document.getElementById("dialoguePortrait").textContent = quest.npc.slice(0, 1);
  document.getElementById("dialoguePortrait").style.background = quest.color;
  document.getElementById("dialogueText").textContent = quest.dialogue;
  dialogueModal.classList.remove("hidden");
}

function closeDialogue() {
  dialogueModal.classList.add("hidden");
  state.paused = false;
  updateInteraction();
}

function openChallenge() {
  dialogueModal.classList.add("hidden");
  const quest = quests[state.questIndex];
  document.getElementById("challengeLevel").textContent = `Quest ${state.questIndex + 1}`;
  document.getElementById("challengeTopic").textContent = quest.topic;
  document.getElementById("problemText").textContent = quest.problem;
  document.getElementById("hintText").classList.add("hidden");
  document.getElementById("hintText").textContent = "";

  const grid = document.getElementById("answerGrid");
  grid.innerHTML = "";
  quest.answers.forEach((answer) => {
    const button = document.createElement("button");
    button.textContent = answer;
    button.addEventListener("click", () => checkAnswer(answer));
    grid.appendChild(button);
  });

  state.paused = true;
  challengeModal.classList.remove("hidden");
}

function checkAnswer(answer) {
  const quest = quests[state.questIndex];
  if (answer === quest.correct) {
    state.correct += 1;
    state.score += 100 + state.questIndex * 25;
    pendingFeedback = "correct";
    showFeedback("Correct!", `${quest.npc}'s quest is complete. Your next adventure is unlocked!`);
  } else {
    state.incorrect += 1;
    state.score = Math.max(0, state.score - 10);
    pendingFeedback = "incorrect";
    showFeedback("Incorrect. Try Again!", "Good attempt. Recheck the question and try another answer.");
  }
  updateHud();
}

function showFeedback(title, text) {
  challengeModal.classList.add("hidden");
  document.getElementById("feedbackTitle").textContent = title;
  document.getElementById("feedbackText").textContent = text;
  feedbackModal.classList.remove("hidden");
}

function continueFromFeedback() {
  feedbackModal.classList.add("hidden");
  if (pendingFeedback === "correct") {
    state.completed += 1;
    state.questIndex += 1;
    updateHud();
    if (state.questIndex >= quests.length) {
      showResults();
      return;
    }
    state.paused = false;
    showToast(`Quest Complete! Now ${quests[state.questIndex].goal}.`);
    return;
  }
  pendingFeedback = null;
  openChallenge();
}

function showHint() {
  const quest = quests[state.questIndex];
  const hint = document.getElementById("hintText");
  if (hint.classList.contains("hidden")) {
    state.hints += 1;
    hint.textContent = quest.hint;
    hint.classList.remove("hidden");
  }
}

function showResults() {
  state.paused = true;
  state.rewardUnlocked = true;
  localStorage.setItem("mathquestRewardUnlocked", "true");
  showScreen("results");
  const accuracy = state.correct + state.incorrect === 0 ? 0 : Math.round((state.correct / (state.correct + state.incorrect)) * 100);
  const achievement = accuracy >= 90 ? "Math Champion" : accuracy >= 75 ? "Quest Solver" : "Brave Learner";
  document.getElementById("resultTitle").textContent = achievement;
  document.getElementById("finalScore").textContent = state.score;
  document.getElementById("finalCorrect").textContent = state.correct;
  document.getElementById("finalIncorrect").textContent = state.incorrect;
  document.getElementById("finalHints").textContent = state.hints;
  document.getElementById("finalQuests").textContent = `${state.completed} / ${quests.length}`;
  document.getElementById("finalAchievement").textContent = `${accuracy}% Accuracy`;
  document.getElementById("rewardCard").classList.remove("hidden");
}

function gameLoop(time) {
  const delta = Math.min(0.033, (time - state.lastTime) / 1000 || 0);
  state.lastTime = time;
  if (state.started && !screens.game.classList.contains("hidden")) {
    movePlayer(delta);
    updateInteraction();
    drawWorld();
  }
  requestAnimationFrame(gameLoop);
}

function setupJoystick() {
  const joystick = document.getElementById("joystick");
  const stick = document.getElementById("stick");
  let activePointer = null;
  let centerX = 0;
  let centerY = 0;

  const reset = () => {
    activePointer = null;
    player.dirX = 0;
    player.dirY = 0;
    stick.style.transform = "translate(0px, 0px)";
  };

  joystick.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    activePointer = event.pointerId;
    const rect = joystick.getBoundingClientRect();
    centerX = rect.left + rect.width / 2;
    centerY = rect.top + rect.height / 2;
    stick.style.transition = "none";
    if (joystick.setPointerCapture) joystick.setPointerCapture(activePointer);
    updateStick(event);
  });

  joystick.addEventListener("pointermove", (event) => {
    event.preventDefault();
    if (event.pointerId === activePointer) updateStick(event);
  });

  joystick.addEventListener("pointerup", (event) => {
    event.preventDefault();
    stick.style.transition = "transform 80ms ease-out";
    reset();
  });
  joystick.addEventListener("pointercancel", (event) => {
    event.preventDefault();
    stick.style.transition = "transform 80ms ease-out";
    reset();
  });
  joystick.addEventListener("lostpointercapture", () => {
    stick.style.transition = "transform 80ms ease-out";
    reset();
  });

  function updateStick(event) {
    const dx = event.clientX - centerX;
    const dy = event.clientY - centerY;
    const len = Math.hypot(dx, dy);
    const max = 42;
    const scale = len > max ? max / len : 1;
    const sx = dx * scale;
    const sy = dy * scale;
    stick.style.transform = `translate(${sx}px, ${sy}px)`;
    player.dirX = sx / max;
    player.dirY = sy / max;
  }
}

document.getElementById("startButton").addEventListener("click", startGame);
document.getElementById("playAgainButton").addEventListener("click", startGame);
document.getElementById("menuButton").addEventListener("click", () => showScreen("menu"));
document.getElementById("exitButton").addEventListener("click", () => {
  showScreen("menu");
  showToast("Adventure closed. Start again whenever you are ready.");
});
talkButton.addEventListener("click", openDialogue);
document.getElementById("laterButton").addEventListener("click", closeDialogue);
document.getElementById("helpButton").addEventListener("click", openChallenge);
document.getElementById("hintButton").addEventListener("click", showHint);
document.getElementById("feedbackButton").addEventListener("click", continueFromFeedback);

window.addEventListener("keydown", (event) => {
  keys.add(event.key);
  if ((event.key === " " || event.key === "Enter") && !talkButton.classList.contains("hidden")) {
    openDialogue();
  }
});
window.addEventListener("keyup", (event) => keys.delete(event.key));
window.addEventListener("resize", resizeCanvas);

resizeCanvas();
setupJoystick();
updateHud();
requestAnimationFrame(gameLoop);
