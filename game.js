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
const REWARD_STORAGE_KEY = "mathquestRewardUnlocked_v2";
const POINTS_STORAGE_KEY = "mathquestPoints_v1";
const HINTS_STORAGE_KEY = "mathquestHints_v1";
const STARTING_HINTS = 2;
const HINT_COST = 300;

const praiseMessages = [
  "Great job!",
  "Amazing!",
  "Excellent!",
  "Fantastic work!",
  "Brilliant solving!",
  "You nailed it!",
  "Super smart move!",
  "Awesome thinking!",
];

function getSavedReward() {
  try {
    return localStorage.getItem(REWARD_STORAGE_KEY) === "true";
  } catch (error) {
    return false;
  }
}

function getSavedNumber(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    if (saved === null) return fallback;
    const value = Number(saved);
    return Number.isFinite(value) ? value : fallback;
  } catch (error) {
    return fallback;
  }
}

function saveProgress() {
  try {
    localStorage.setItem(POINTS_STORAGE_KEY, String(state.score));
    localStorage.setItem(HINTS_STORAGE_KEY, String(state.hintsAvailable));
  } catch (error) {
    // Progress remains available for the current session if storage is unavailable.
  }
}

function saveReward() {
  try {
    localStorage.setItem(REWARD_STORAGE_KEY, "true");
  } catch (error) {
    // Reward visuals still unlock for the current run if storage is unavailable.
  }
}

if ("serviceWorker" in navigator && /^https?:$/.test(window.location.protocol)) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {
      // The game still runs from plain files; offline install needs a browser-served copy.
    });
  });
}

const levelTemplates = [
  {
    npc: "Lina",
    icon: "!",
    color: "#ffdd57",
    x: 430,
    y: 320,
    levelName: "Easy Road",
    difficulty: "easy",
    goal: "Easy Road: Find Lina",
    dialogue: "Welcome to the Easy Road. Help me solve one starter problem to open the next road.",
  },
  {
    npc: "Bo",
    icon: "!",
    color: "#65d6ff",
    x: 850,
    y: 360,
    levelName: "Medium Road",
    difficulty: "medium",
    goal: "Medium Road: Find Bo",
    dialogue: "You reached the Medium Road. The numbers are growing, but I know you can handle them.",
  },
  {
    npc: "Mira",
    icon: "!",
    color: "#ff9ab3",
    x: 1280,
    y: 560,
    levelName: "Intermediate Road",
    difficulty: "intermediate",
    goal: "Intermediate Road: Find Mira",
    dialogue: "This is the Intermediate Road. These quests need more than one step, so take your time.",
  },
  {
    npc: "Orin",
    icon: "!",
    color: "#ff8c42",
    x: 1720,
    y: 250,
    levelName: "Hard Road",
    difficulty: "hard",
    goal: "Hard Road: Find Orin",
    dialogue: "The Hard Road is tricky. Solve carefully and the final road will appear.",
  },
  {
    npc: "Zara",
    icon: "!",
    color: "#70e4ad",
    x: 2260,
    y: 500,
    levelName: "Advanced Road",
    difficulty: "advanced",
    goal: "Advanced Road: Find Zara",
    dialogue: "This is the final advanced road. Solve my challenge to earn the cape and crown.",
  },
];

let quests = [];

const problemBank = buildProblemBank();

function buildProblemBank() {
  return {
    easy: buildEasyProblems(),
    medium: buildMediumProblems(),
    intermediate: buildIntermediateProblems(),
    hard: buildHardProblems(),
    advanced: buildAdvancedProblems(),
  };
}

function buildEasyProblems() {
  return expandPatterns([
    (i) => storyProblem("Easy Addition", `Lina picks ${7 + i} sun apples and ${4 + i} moon apples. How many apples does she have?`, 11 + i * 2, `Add both groups of apples together.`, [-2, -1, 3]),
    (i) => storyProblem("Easy Subtraction", `${19 + i * 2} paper boats float in the pond. ${6 + i} sail away. How many boats are left?`, 13 + i, `Take away the boats that sailed away.`, [-3, 2, 4]),
    (i) => storyProblem("Easy Counting", `A path has ${5 + i} blue stones, ${3 + i} red stones, and 2 gold stones. How many stones are on the path?`, 10 + i * 2, `Add blue, red, and gold stones.`, [-2, 1, 3]),
    (i) => storyProblem("Easy Missing Number", `A sign says 9 + ? = ${14 + i}. What number is missing?`, 5 + i, `Ask what you add to 9 to reach the total.`, [-2, 1, 3]),
    (i) => storyProblem("Easy Comparison", `Bo has ${12 + i} blocks. Lina has ${8 + i} blocks. How many more blocks does Bo have?`, 4, `Find the difference between the two amounts.`, [2, 5, 6]),
    (i) => storyProblem("Easy Skip Count", `There are ${3 + i} baskets with 2 oranges in each. How many oranges are there?`, (3 + i) * 2, `Count by twos for each basket.`, [-2, 2, 4]),
    (i) => storyProblem("Easy Money", `A sticker costs ${6 + i} coins. A pencil costs ${5 + i} coins. How many coins are needed for both?`, 11 + i * 2, `Add the two prices.`, [-1, 2, 5]),
    (i) => storyProblem("Easy Time", `The bell rings in ${10 + i} minutes. ${4 + i} minutes pass. How many minutes are left?`, 6, `Subtract the minutes that passed.`, [4, 7, 8]),
    (i) => storyProblem("Easy Shapes", `A small bridge uses ${4 + i} triangle tiles and ${6 + i} square tiles. How many tiles are used?`, 10 + i * 2, `Add both kinds of tiles.`, [-2, 1, 4]),
    (i) => storyProblem("Easy Equal Groups", `${16 + i * 2} shells are split equally between 2 friends. How many shells does each friend get?`, 8 + i, `Split the shells into two equal groups.`, [-2, 2, 4]),
  ]);
}

function buildMediumProblems() {
  return expandPatterns([
    (i) => storyProblem("Medium Multiplication", `${4 + i} gardens each have ${6 + i} flowers. How many flowers are there?`, (4 + i) * (6 + i), `Multiply the number of gardens by flowers in each garden.`, [-6, 4, 8]),
    (i) => storyProblem("Medium Division", `${36 + i * 12} crystals are packed equally into ${4 + i} boxes. How many crystals per box?`, (36 + i * 12) / (4 + i), `Divide the total crystals by the number of boxes.`, [-2, 3, 6]),
    (i) => storyProblem("Medium Perimeter", `A square animal pen has sides of ${7 + i} meters. What is its perimeter?`, (7 + i) * 4, `A square has 4 equal sides.`, [-4, 4, 8]),
    (i) => storyProblem("Medium Money", `Mira buys ${3 + i} notebooks that cost ${8 + i} coins each. How many coins does she spend?`, (3 + i) * (8 + i), `Multiply items by cost each.`, [-5, 4, 9]),
    (i) => storyProblem("Medium Remainder", `Bo has ${29 + i * 5} blocks. He builds towers with 5 blocks each. How many blocks are left over?`, (29 + i * 5) % 5, `Divide by 5 and look at the leftover blocks.`, [1, 3, 5]),
    (i) => storyProblem("Medium Two-Step", `A cart starts with ${25 + i * 4} berries. Lina adds ${12 + i}, then Bo eats 8. How many berries remain?`, 29 + i * 5, `Add first, then subtract 8.`, [-4, 3, 8]),
    (i) => storyProblem("Medium Fractions", `A ribbon has ${24 + i * 6} stars. One half are yellow. How many stars are yellow?`, (24 + i * 6) / 2, `One half means divide by 2.`, [-3, 3, 6]),
    (i) => storyProblem("Medium Area", `A farm patch is ${5 + i} tiles long and ${4 + i} tiles wide. How many tiles cover it?`, (5 + i) * (4 + i), `Area is length times width.`, [-4, 5, 7]),
    (i) => storyProblem("Medium Pattern", `The magic numbers go ${6 + i}, ${12 + i * 2}, ${18 + i * 3}, __. What comes next?`, 24 + i * 4, `The pattern adds the same amount each step.`, [-6, 3, 6]),
    (i) => storyProblem("Medium Average", `Three scores are ${8 + i}, ${10 + i}, and ${12 + i}. What is the average score?`, 10 + i, `Add the scores, then divide by 3.`, [-2, 1, 3]),
  ]);
}

function buildIntermediateProblems() {
  return expandPatterns([
    (i) => storyProblem("Intermediate Multi-Step", `${3 + i} crates hold ${12 + i} apples each. Mira sells ${9 + i}. How many apples are left?`, (3 + i) * (12 + i) - (9 + i), `Multiply crates by apples, then subtract sold apples.`, [-8, 6, 11]),
    (i) => storyProblem("Intermediate Division", `${(6 + i) * (9 + i * 3)} tickets are shared by ${6 + i} teams. How many tickets per team?`, 9 + i * 3, `Divide tickets by teams.`, [-3, 2, 5]),
    (i) => storyProblem("Intermediate Fraction", `A treasure map has ${48 + i * 12} squares. Three fourths are forest. How many squares are forest?`, ((48 + i * 12) / 4) * 3, `Find one fourth first, then multiply by 3.`, [-6, 4, 9]),
    (i) => storyProblem("Intermediate Equation", `A mystery number plus ${17 + i} equals ${46 + i * 3}. What is the mystery number?`, 29 + i * 2, `Subtract the known addend from the total.`, [-4, 3, 7]),
    (i) => storyProblem("Intermediate Measurement", `A rope is ${(5 + i) * (18 + i * 2)} cm long. It is cut into ${5 + i} equal pieces. How long is each piece?`, 18 + i * 2, `Divide total length by number of pieces.`, [-5, 5, 10]),
    (i) => storyProblem("Intermediate Area", `A rectangular garden is ${9 + i} meters long and ${6 + i} meters wide. What is its area?`, (9 + i) * (6 + i), `Area is length times width.`, [-8, 7, 12]),
    (i) => storyProblem("Intermediate Money", `A game pass costs ${15 + i * 2} coins. Zara buys ${4 + i} passes and has 20 coins left. How many coins did she start with?`, (15 + i * 2) * (4 + i) + 20, `Find total cost, then add the leftover coins.`, [-10, 8, 15]),
    (i) => storyProblem("Intermediate Time", `A quest starts at ${2 + i}:15 and lasts ${90 + i * 15} minutes. How many minutes after the hour does it end?`, (15 + 90 + i * 15) % 60, `Add the minutes and find what remains after full hours.`, [0, 15, 45]),
    (i) => storyProblem("Intermediate Pattern", `A crystal doubles each day. It starts with ${3 + i} crystals. How many are there after 3 days?`, (3 + i) * 8, `Doubling 3 times means multiply by 2 x 2 x 2.`, [-8, 4, 12]),
    (i) => storyProblem("Intermediate Data", `Four scores are ${6 + i}, ${8 + i}, ${10 + i}, and ${12 + i}. What is their range?`, 6, `Range means biggest minus smallest.`, [4, 8, 10]),
  ]);
}

function buildAdvancedProblems() {
  return expandPatterns([
    (i) => storyProblem("Advanced Order", `The gate code is ${18 + i} + ${5 + i} x ${4 + i}. What is the code?`, 18 + i + (5 + i) * (4 + i), `Multiply before adding.`, [-9, 6, 12]),
    (i) => storyProblem("Advanced Percent", `Zara needs 25% of ${120 + i * 40} tiles. How many tiles is that?`, (120 + i * 40) / 4, `25% is one fourth.`, [-10, 10, 20]),
    (i) => storyProblem("Advanced Fraction", `Three fifths of ${100 + i * 25} gems glow. How many gems glow?`, ((100 + i * 25) / 5) * 3, `Find one fifth, then multiply by 3.`, [-15, 10, 25]),
    (i) => storyProblem("Advanced Multi-Step", `${4 + i} chests have ${24 + i * 3} coins each. ${18 + i * 3} coins are spent, then the rest is split between 3 guards. How many coins per guard?`, (((4 + i) * (24 + i * 3)) - (18 + i * 3)) / 3, `Multiply, subtract, then divide by 3.`, [-12, 9, 18]),
    (i) => storyProblem("Advanced Ratio", `A potion uses red and blue drops in a 2:3 ratio. If there are ${12 + i * 4} red drops, how many blue drops are needed?`, ((12 + i * 4) / 2) * 3, `If 2 parts equals the red drops, find 1 part, then 3 parts.`, [-6, 6, 12]),
    (i) => storyProblem("Advanced Average", `Five race times are ${20 + i}, ${22 + i}, ${24 + i}, ${26 + i}, and ${28 + i}. What is the average?`, 24 + i, `The numbers are evenly spaced, so the middle value is the average.`, [-4, 2, 5]),
    (i) => storyProblem("Advanced Geometry", `A rectangle has an area of ${72 + i * 24} square tiles and a width of ${6 + i * 2}. What is its length?`, (72 + i * 24) / (6 + i * 2), `Length equals area divided by width.`, [-3, 3, 6]),
    (i) => storyProblem("Advanced Discount", `A magic shield costs ${80 + i * 20} coins. It is half price. How many coins does it cost now?`, (80 + i * 20) / 2, `Half price means divide by 2.`, [-10, 10, 30]),
    (i) => storyProblem("Advanced Expression", `Solve (${8 + i} + ${4 + i}) x 3.`, ((8 + i) + (4 + i)) * 3, `Do the parentheses first, then multiply by 3.`, [-6, 6, 9]),
    (i) => storyProblem("Advanced Logic", `A code is 4 more than twice ${11 + i}. What is the code?`, (11 + i) * 2 + 4, `Double the number, then add 4.`, [-4, 4, 8]),
  ]);
}

function buildHardProblems() {
  return expandPatterns([
    (i) => storyProblem("Hard Multi-Step", `${4 + i} treasure bags hold ${20 + i * 4} coins each. Zara adds ${16 + i * 4} coins, then shares everything across 4 chests. How many coins per chest?`, ((4 + i) * (20 + i * 4) + (16 + i * 4)) / 4, `Multiply bags and coins, add bonus coins, then divide by 4.`, [-8, 6, 14]),
    (i) => storyProblem("Hard Fractions", `The gate needs half of ${80 + i * 16}, plus one fourth of ${80 + i * 16}, then minus ${8 + i}. What number opens it?`, (80 + i * 16) / 2 + (80 + i * 16) / 4 - (8 + i), `Find half and one fourth, add them, then subtract.`, [-12, 10, 18]),
    (i) => storyProblem("Hard Equation", `Three times a number minus ${9 + i} equals ${(17 + i * 4) * 3 - (9 + i)}. What is the number?`, 17 + i * 4, `Add back the subtracted amount, then divide by 3.`, [-3, 3, 6]),
    (i) => storyProblem("Hard Percent", `A village goal is ${200 + i * 50} coins. The team has collected 40%. How many coins is that?`, (200 + i * 50) * 0.4, `40% means 4 tenths, or multiply by 0.4.`, [-20, 20, 40]),
    (i) => storyProblem("Hard Ratio", `Roblox-style teams have a 3:5 ratio of builders to explorers. If there are ${15 + i * 6} builders, how many explorers are there?`, ((15 + i * 6) / 3) * 5, `Find one ratio part, then multiply by 5.`, [-10, 5, 15]),
    (i) => storyProblem("Hard Volume", `A block chest is ${4 + i} blocks long, ${3 + i} blocks wide, and 5 blocks tall. How many blocks fit inside?`, (4 + i) * (3 + i) * 5, `Volume is length x width x height.`, [-15, 10, 20]),
    (i) => storyProblem("Hard Speed", `A minecart travels ${90 + i * 30} meters in 3 minutes. How many meters per minute is that?`, (90 + i * 30) / 3, `Divide distance by time.`, [-10, 10, 30]),
    (i) => storyProblem("Hard Mixed Numbers", `A recipe uses ${6 + i} cups of slime, then triples it and removes ${5 + i} cups. How many cups remain?`, (6 + i) * 3 - (5 + i), `Triple the cups, then subtract.`, [-4, 4, 8]),
    (i) => storyProblem("Hard Coordinates", `A player moves from x=${3 + i} to x=${18 + i * 2}. How many spaces did the player move?`, 15 + i, `Subtract the starting coordinate from the ending coordinate.`, [-3, 3, 5]),
    (i) => storyProblem("Hard Probability", `A bag has ${6 + i} red gems and ${(6 + i) * 3} total gems. In the simplified fraction, what is the denominator?`, 3, `The red gems are one third of the total, so the denominator is 3.`, [2, 4, 6]),
  ]);
}

function expandPatterns(patterns) {
  return patterns.flatMap((pattern) => [0, 1, 2].map(pattern));
}

function storyProblem(topic, problem, correct, hint, offsets) {
  const roundedCorrect = Math.round(correct);
  return makeProblem(
    topic,
    problem,
    roundedCorrect,
    hint,
    offsets.map((offset) => roundedCorrect + offset)
  );
}

function makeProblem(topic, problem, correct, hint, distractors) {
  const answers = shuffle([...new Set([correct, ...distractors.filter((value) => value !== correct && value >= 0)])]).slice(0, 4);
  let offset = 2;
  while (answers.length < 4) {
    const next = correct + offset;
    if (!answers.includes(next)) answers.push(next);
    offset += 1;
  }
  return { topic, problem, correct, hint, answers: shuffle(answers) };
}

function createQuestRun() {
  return levelTemplates.map((template) => {
    const bank = problemBank[template.difficulty];
    const problem = bank[Math.floor(Math.random() * bank.length)];
    return { ...template, ...problem };
  });
}

function shuffle(items) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

quests = createQuestRun();

const world = {
  width: 2550,
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
  score: getSavedNumber(POINTS_STORAGE_KEY, 0),
  correct: 0,
  incorrect: 0,
  hintsUsed: 0,
  hintsAvailable: getSavedNumber(HINTS_STORAGE_KEY, STARTING_HINTS),
  chancesLeft: 2,
  completed: 0,
  activeNpc: null,
  lastTime: 0,
  rewardUnlocked: getSavedReward(),
};

const keys = new Set();
let toastTimer = 0;
let feedbackTimer = 0;
let pendingFeedback = null;

const objects = [
  { type: "house", x: 170, y: 140, w: 130, h: 110, roof: "#dd6553", wall: "#ffe08a" },
  { type: "house", x: 610, y: 120, w: 145, h: 118, roof: "#7a61d1", wall: "#e7d5ff" },
  { type: "house", x: 1110, y: 105, w: 150, h: 120, roof: "#ef8a45", wall: "#ffd7a1" },
  { type: "house", x: 1580, y: 640, w: 150, h: 118, roof: "#3584cf", wall: "#bee7ff" },
  { type: "house", x: 2190, y: 620, w: 150, h: 118, roof: "#24a36b", wall: "#c7f7d8" },
  { type: "tree", x: 90, y: 540 }, { type: "tree", x: 330, y: 660 }, { type: "tree", x: 560, y: 505 },
  { type: "tree", x: 920, y: 660 }, { type: "tree", x: 1390, y: 170 }, { type: "tree", x: 1710, y: 150 },
  { type: "tree", x: 1930, y: 620 }, { type: "tree", x: 1310, y: 735 }, { type: "tree", x: 810, y: 180 },
  { type: "tree", x: 2340, y: 210 },
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
  quests = createQuestRun();
  player.x = 220;
  player.y = 410;
  state.questIndex = 0;
  state.correct = 0;
  state.incorrect = 0;
  state.hintsUsed = 0;
  state.chancesLeft = 2;
  state.completed = 0;
  state.activeNpc = null;
  state.paused = false;
  updateHud();
}

function startGame() {
  resetGame();
  state.started = true;
  showScreen("game");
  showToast(state.rewardUnlocked ? "Cape and crown equipped. Start on the Easy Road!" : "Start on the Easy Road. NPCs with ! have quests.");
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
  document.getElementById("hudHintText").textContent = state.hintsAvailable;
  document.getElementById("goalText").textContent = state.questIndex < quests.length ? quests[state.questIndex].goal : "Final Results";
}

function updateChallengeStatus() {
  const hintCount = document.getElementById("hintCountText");
  const chanceCount = document.getElementById("chanceText");
  const hintButton = document.getElementById("hintButton");
  if (hintCount) hintCount.textContent = state.hintsAvailable;
  if (chanceCount) chanceCount.textContent = state.chancesLeft;
  if (hintButton) {
    hintButton.textContent = state.hintsAvailable > 0 ? "Hint" : `Buy Hint (${HINT_COST})`;
  }
}

function randomPraise() {
  return praiseMessages[Math.floor(Math.random() * praiseMessages.length)];
}

function refreshCurrentQuestProblem() {
  const current = quests[state.questIndex];
  const bank = problemBank[current.difficulty];
  const problem = bank[Math.floor(Math.random() * bank.length)];
  quests[state.questIndex] = { ...current, ...problem };
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.remove("hidden");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.add("hidden"), 3000);
}

function playHintPurchaseAnimation() {
  const burst = document.createElement("div");
  burst.className = "hint-purchase-burst";
  burst.textContent = "+1 Hint Bought";
  document.getElementById("app").appendChild(burst);
  setTimeout(() => burst.remove(), 1000);
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
  const roads = [
    { label: "Easy", color: "#f4dc91", points: [[80, 430], [350, 300], [520, 380]] },
    { label: "Medium", color: "#d8c17c", points: [[520, 380], [750, 450], [920, 360]] },
    { label: "Intermediate", color: "#c79b69", points: [[920, 360], [1120, 420], [1360, 560]] },
    { label: "Hard", color: "#b8865d", points: [[1360, 560], [1570, 350], [1840, 300]] },
    { label: "Advanced", color: "#9b6d56", points: [[1840, 300], [2070, 360], [2380, 500]] },
  ];

  roads.forEach((road) => {
    ctx.strokeStyle = "#d3a958";
    ctx.lineWidth = 62;
    ctx.beginPath();
    ctx.moveTo(road.points[0][0], road.points[0][1]);
    ctx.quadraticCurveTo(road.points[1][0], road.points[1][1], road.points[2][0], road.points[2][1]);
    ctx.stroke();

    ctx.strokeStyle = road.color;
    ctx.lineWidth = 38;
    ctx.stroke();

    const labelX = (road.points[0][0] + road.points[2][0]) / 2;
    const labelY = (road.points[0][1] + road.points[2][1]) / 2 - 38;
    ctx.fillStyle = "rgba(255, 253, 246, 0.82)";
    const labelWidth = road.label === "Intermediate" ? 118 : 88;
    ctx.fillRect(labelX - labelWidth / 2, labelY - 16, labelWidth, 28);
    ctx.fillStyle = "#17324a";
    ctx.font = "900 13px system-ui";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(road.label, labelX, labelY - 1);
  });
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
    drawCheckIcon(quest.x + 25, quest.y - 40);
  }

  ctx.fillStyle = "#17324a";
  ctx.font = "800 15px system-ui";
  ctx.textAlign = "center";
  ctx.fillText(quest.npc, quest.x, quest.y + 65);
  ctx.globalAlpha = 1;
}

function drawCheckIcon(x, y) {
  ctx.fillStyle = "#21b26b";
  ctx.beginPath();
  ctx.arc(x, y, 15, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(x - 7, y);
  ctx.lineTo(x - 2, y + 6);
  ctx.lineTo(x + 8, y - 7);
  ctx.stroke();
}

function drawPlayer() {
  drawPlayerPointer();

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

  if (state.rewardUnlocked) {
    ctx.fillStyle = "#f6bd2f";
    ctx.beginPath();
    ctx.moveTo(player.x - 16, player.y - 30);
    ctx.lineTo(player.x - 7, player.y - 43);
    ctx.lineTo(player.x, player.y - 31);
    ctx.lineTo(player.x + 7, player.y - 43);
    ctx.lineTo(player.x + 16, player.y - 30);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#9b6500";
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(player.x - 6, player.y - 12, 3, 0, Math.PI * 2);
  ctx.arc(player.x + 6, player.y - 12, 3, 0, Math.PI * 2);
  ctx.fill();
}

function drawPlayerPointer() {
  const bob = Math.sin(performance.now() / 220) * 4;
  const x = player.x;
  const y = player.y - 76 + bob;

  ctx.fillStyle = "rgba(23, 50, 74, 0.18)";
  ctx.beginPath();
  ctx.ellipse(x, y + 6, 18, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#ffd43b";
  ctx.strokeStyle = "#7a4a00";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x, y + 30);
  ctx.lineTo(x - 20, y);
  ctx.lineTo(x - 7, y);
  ctx.lineTo(x - 7, y - 26);
  ctx.lineTo(x + 7, y - 26);
  ctx.lineTo(x + 7, y);
  ctx.lineTo(x + 20, y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
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
  state.chancesLeft = 2;
  document.getElementById("challengeLevel").textContent = `Level ${state.questIndex + 1} of ${quests.length}`;
  document.getElementById("challengeTopic").textContent = `${quest.levelName} - ${quest.topic}`;
  document.getElementById("problemText").textContent = quest.problem;
  document.getElementById("hintText").classList.add("hidden");
  document.getElementById("hintText").textContent = "";
  updateChallengeStatus();
  renderAnswers(quest);

  state.paused = true;
  challengeModal.classList.remove("hidden");
}

function renderAnswers(quest) {
  const grid = document.getElementById("answerGrid");
  grid.innerHTML = "";
  shuffle(quest.answers).forEach((answer) => {
    const button = document.createElement("button");
    button.textContent = answer;
    button.addEventListener("click", () => checkAnswer(answer));
    grid.appendChild(button);
  });
}

function checkAnswer(answer) {
  const quest = quests[state.questIndex];
  if (answer === quest.correct) {
    state.correct += 1;
    state.score += 100;
    state.hintsAvailable += 1;
    saveProgress();
    pendingFeedback = "correct";
    showFeedback("Correct!", `${randomPraise()} You earned 100 points and 1 hint. ${quest.levelName} is complete!`);
  } else {
    state.chancesLeft -= 1;
    updateChallengeStatus();
    renderAnswers(quest);
    if (state.chancesLeft > 0) {
      pendingFeedback = "tryAgainSame";
      showFeedback("Incorrect. Try Again!", "Good attempt. You have 1 chance left for this question.", true);
      updateHud();
      return;
    }

    state.incorrect += 1;
    pendingFeedback = "retryNewQuestion";
    showFeedback("Out of Chances", `${quest.npc} says: Talk to me again and I will give you a different question.`, true);
  }
  updateHud();
}

function showFeedback(title, text, autoDismiss = false) {
  clearTimeout(feedbackTimer);
  challengeModal.classList.add("hidden");
  document.getElementById("feedbackTitle").textContent = title;
  document.getElementById("feedbackText").textContent = text;
  feedbackModal.classList.remove("hidden");
  if (autoDismiss) {
    feedbackTimer = setTimeout(continueFromFeedback, 3000);
  }
}

function continueFromFeedback() {
  clearTimeout(feedbackTimer);
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
    showToast(`Level Complete! Now ${quests[state.questIndex].goal}.`);
    return;
  }

  if (pendingFeedback === "tryAgainSame") {
    pendingFeedback = null;
    challengeModal.classList.remove("hidden");
    state.paused = true;
    return;
  }

  if (pendingFeedback === "retryNewQuestion") {
    const npcName = quests[state.questIndex].npc;
    pendingFeedback = null;
    refreshCurrentQuestProblem();
    state.paused = false;
    updateInteraction();
    showToast(`Talk to ${npcName} again to help with a new question.`);
    return;
  }

  pendingFeedback = null;
  openChallenge();
}

function showHint() {
  const quest = quests[state.questIndex];
  const hint = document.getElementById("hintText");
  if (hint.classList.contains("hidden")) {
    if (state.hintsAvailable > 0) {
      state.hintsAvailable -= 1;
    } else if (state.score >= HINT_COST) {
      state.score -= HINT_COST;
      playHintPurchaseAnimation();
      showToast(`Bought a hint for ${HINT_COST} points.`);
    } else {
      showToast(`Need ${HINT_COST} points to buy a hint.`);
      return;
    }
    state.hintsUsed += 1;
    saveProgress();
    updateHud();
    updateChallengeStatus();
    hint.textContent = quest.hint;
    hint.classList.remove("hidden");
  }
}

function showResults() {
  state.paused = true;
  state.rewardUnlocked = true;
  saveReward();
  showScreen("results");
  const accuracy = state.correct + state.incorrect === 0 ? 0 : Math.round((state.correct / (state.correct + state.incorrect)) * 100);
  const achievement = accuracy >= 90 ? "Math Champion" : accuracy >= 75 ? "Quest Solver" : "Brave Learner";
  document.getElementById("resultTitle").textContent = achievement;
  document.getElementById("finalScore").textContent = state.score;
  document.getElementById("finalCorrect").textContent = state.correct;
  document.getElementById("finalIncorrect").textContent = state.incorrect;
  document.getElementById("finalHints").textContent = state.hintsUsed;
  document.getElementById("finalQuests").textContent = `${state.completed} / ${quests.length}`;
  document.getElementById("finalAchievement").textContent = `${accuracy}% Accuracy`;
  document.getElementById("rewardCard").classList.remove("hidden");
}

function closeChallenge() {
  challengeModal.classList.add("hidden");
  document.getElementById("hintText").classList.add("hidden");
  state.paused = false;
  updateInteraction();
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
document.getElementById("backChallengeButton").addEventListener("click", closeChallenge);
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
