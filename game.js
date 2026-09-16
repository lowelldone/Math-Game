const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const screens = {
  loading: document.getElementById("loadingScreen"),
  menu: document.getElementById("mainMenu"),
  game: document.getElementById("gameScreen"),
  results: document.getElementById("resultsScreen"),
};

const dialogueModal = document.getElementById("dialogueModal");
const challengeModal = document.getElementById("challengeModal");
const feedbackModal = document.getElementById("feedbackModal");
const settingsModal = document.getElementById("settingsModal");
const talkButton = document.getElementById("talkButton");
const toast = document.getElementById("toast");
const loadingFill = document.getElementById("loadingFill");
const loadingPercent = document.getElementById("loadingPercent");
const REWARD_STORAGE_KEY = "mathquestRewardUnlocked_v2";
const POINTS_STORAGE_KEY = "mathquestPoints_v1";
const HINTS_STORAGE_KEY = "mathquestHints_v1";
const AUDIO_STORAGE_KEY = "mathquestAudioOn_v1";
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

// Images are mapped by question number in bank order:
// Questions 1-10 = Easy, 11-20 = Medium, 21-30 = Intermediate.
function attachQuestionImages() {
  const orderedBanks = [
    problemBank.easy,
    problemBank.medium,
    problemBank.intermediate,
  ];
  let questionNumber = 1;

  orderedBanks.forEach((bank) => {
    bank.forEach((problem) => {
      if (questionNumber <= 30) {
        problem.image = `Images/question-${String(questionNumber).padStart(2, "0")}.jpg`;
      }
      questionNumber += 1;
    });
  });
}

attachQuestionImages();

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
  return [
    makeChoiceProblem(
      "Easy Temperature",
      "The highest temperature today was 30°C, and the lowest was 26°C. What was the difference in temperature?",
      "4°C",
      "Difference means highest minus lowest: 30 − 26 = 4.",
      ["5°C", "4°C", "3°C", "2°C"]
    ),
    makeChoiceProblem(
      "Easy Subtraction",
      "A store had 3,000 items in stock and sold 1,284 items during a sale. How many items remain?",
      "1,716 items",
      "Subtract the items sold from the items in stock: 3,000 − 1,284. Borrow carefully from the thousands.",
      ["1,716 items", "1,826 items", "2,716 items", "1,684 items"]
    ),
    makeChoiceProblem(
      "Easy Subtraction",
      "A school bakery baked 1,500 pieces of pandesal in the morning. By noon, they sold 850 pieces. How many pieces of pandesal are left?",
      "650 pieces",
      "Subtract the pieces sold from the pieces baked: 1,500 − 850.",
      ["750 pieces", "650 pieces", "600 pieces", "550 pieces"]
    ),
    makeChoiceProblem(
      "Easy Money",
      "A family has ₱250 budgeted for groceries and spends ₱178. How much money is left?",
      "₱72",
      "Subtract ₱178 from ₱250.",
      ["₱72", "₱75", "₱80", "₱70"]
    ),
    makeChoiceProblem(
      "Easy Subtraction",
      "A ribbon is 7 m long. A tailor cuts off 2 m. How much ribbon is left?",
      "5",
      "Subtract the length cut off from the original length: 7 − 2.",
      ["3", "4", "5", "6"]
    ),
    makeChoiceProblem(
      "Easy Addition",
      "The library has 4,286 fiction books and 2,759 nonfiction books. How many books does the library have in total?",
      "7,045",
      "Add 4,286 and 2,759. Add ones, tens, hundreds, then thousands, and carry whenever a column is 10 or more.",
      ["6,045", "7,045", "7,145", "6,935"]
    ),
    makeChoiceProblem(
      "Easy Addition",
      "A cyclist rode 12 km on Monday and 8 km on Tuesday. How far did she ride altogether?",
      "20",
      "Add Monday and Tuesday: 12 + 8.",
      ["20", "30", "40", "50"]
    ),
    makeChoiceProblem(
      "Easy Addition",
      "A barangay planted 1,230 mangrove seedlings on Saturday and 1,140 seedlings on Sunday. How many mangrove seedlings did they plant in total?",
      "2,370 seedlings",
      "Add Saturday and Sunday: 1,230 + 1,140.",
      ["2,270 seedlings", "2,370 seedlings", "2,470 seedlings", "2,350 seedlings"]
    ),
    makeChoiceProblem(
      "Easy Addition",
      "A farmer harvested 1,000 kg of corn, 500 kg of wheat, and 800 kg of rice. How many kilograms of grain did he harvest in all?",
      "2,300 kg",
      "Add all three harvests: 1,000 + 500 + 800.",
      ["2,000 kg", "2,300 kg", "2,600 kg", "2,900 kg"]
    ),
    makeChoiceProblem(
      "Easy Money",
      "My friend saved ₱200 from her allowance, ₱100 from selling snacks, and ₱300 from her birthday money. How much money does she have in total?",
      "₱600",
      "Add the three amounts: ₱200 + ₱100 + ₱300.",
      ["₱500", "₱600", "₱700", "₱800"]
    ),
  ];
}

function buildMediumProblems() {
  return [
    makeChoiceProblem(
      "Medium Multiplication",
      "My friend bought 4 notebooks. Each notebook costs ₱15. How much did my friend spend altogether?",
      "60 pesos",
      "Multiply the number of notebooks by the cost of one notebook: 4 × 15.",
      ["55 pesos", "60 pesos", "45 pesos", "65 pesos"]
    ),
    makeChoiceProblem(
      "Medium Division",
      "My student has 24 erasers. He wants to put them equally into 6 boxes. How many erasers will be in each box?",
      "4 erasers",
      "Share 24 erasers equally among 6 boxes. Divide 24 by 6.",
      ["4 erasers", "7 erasers", "5 erasers", "3 erasers"]
    ),
    makeChoiceProblem(
      "Medium Multiplication",
      "A teacher gives 5 pencils to each of her 6 students. How many pencils does she give in total?",
      "30 pencils",
      "Each of the 6 students gets 5 pencils, so multiply 6 × 5.",
      ["20 pencils", "25 pencils", "15 pencils", "30 pencils"]
    ),
    makeChoiceProblem(
      "Medium Division",
      "There are 32 storybooks in the classroom. The teacher places them equally on 4 shelves. How many storybooks are on each shelf?",
      "8 storybooks",
      "Divide the 32 storybooks equally among 4 shelves: 32 ÷ 4.",
      ["8 storybooks", "7 storybooks", "4 storybooks", "10 storybooks"]
    ),
    makeChoiceProblem(
      "Medium Multiplication",
      "I bought 3 packs of biscuits. Each pack contains 8 biscuits. How many biscuits do I have altogether?",
      "24 biscuits",
      "Multiply the number of packs by the biscuits in each pack: 3 × 8.",
      ["20 biscuits", "16 biscuits", "24 biscuits", "32 biscuits"]
    ),
    makeChoiceProblem(
      "Medium Multiplication",
      "There are 125 rows of chairs in the auditorium. Each row has 16 chairs. How many chairs are there altogether?",
      "2,000",
      "Multiply the number of rows by the chairs in each row: 125 × 16.",
      ["1,800", "2,000", "2,200", "2,250"]
    ),
    makeChoiceProblem(
      "Medium Multiplication",
      "A library receives 125 boxes of books. Each box contains 48 books. How many books did the library receive in total?",
      "6,000",
      "Multiply the number of boxes by the books in each box: 125 × 48.",
      ["5,800", "6,000", "6,200", "6,250"]
    ),
    makeChoiceProblem(
      "Medium Multiplication",
      "The teacher prepared 18 sets of school supplies for her students. Each set has 24 pencils. How many pencils did the teacher prepare altogether?",
      "432",
      "Multiply the number of sets by the pencils in each set: 18 × 24.",
      ["392", "412", "432", "452"]
    ),
    makeChoiceProblem(
      "Medium Division",
      "During a school activity, 420 sheets of paper were distributed equally among 15 students. How many sheets of paper did each student receive?",
      "28",
      "Share 420 sheets equally among 15 students. Divide 420 by 15.",
      ["24", "28", "32", "35"]
    ),
    makeChoiceProblem(
      "Medium Division",
      "A library has 384 storybooks. The teacher wants to place them equally on 16 shelves. How many storybooks should be placed on each shelf?",
      "24",
      "Share 384 storybooks equally across 16 shelves. Divide 384 by 16.",
      ["18", "24", "26", "32"]
    ),
  ];
}

function buildIntermediateProblems() {
  return [
    makeChoiceProblem(
      "Intermediate Money",
      "My friends and I put together 10 pesos each, giving us 30 pesos in total. We bought gummy bears for 10 pesos, sour strips for 15 pesos, and cola gummies for 5 pesos. How much did we spend on candies altogether?",
      "₱30",
      "Add the three candy prices: 10 + 15 + 5.",
      ["₱30", "₱40", "₱50", "₱60"]
    ),
    makeChoiceProblem(
      "Intermediate Money",
      "My brother has 150 pesos. He buys a sandwich for 65 pesos and two juice boxes for 20 pesos each. How much money does he have left?",
      "₱45",
      "Find the cost of two juice boxes (20 × 2), add the sandwich, then subtract that total from 150.",
      ["₱25", "₱35", "₱45", "₱55"]
    ),
    makeChoiceProblem(
      "Intermediate Multi-Step",
      "I bought 4 packs of highlighters with 6 highlighters in each pack. I shared 9 highlighters with my classmates. How many highlighters do I have left?",
      "15 highlighters",
      "Multiply packs by highlighters per pack (4 × 6), then subtract the 9 you shared.",
      ["5 highlighters", "10 highlighters", "15 highlighters", "20 highlighters"]
    ),
    makeChoiceProblem(
      "Intermediate Multi-Step",
      "Our school athlete ran 8 laps on Thursday and 12 laps on Friday. On Saturday, she ran 5 more laps than Friday. How many laps did she run altogether?",
      "37 laps",
      "Saturday is Friday plus 5 (12 + 5). Then add Thursday, Friday, and Saturday.",
      ["37 laps", "47 laps", "57 laps", "67 laps"]
    ),
    makeChoiceProblem(
      "Intermediate Division",
      "A teacher has 72 sheets of colored paper. She puts 8 sheets into each folder for an art activity. How many folders can she prepare?",
      "9 folders",
      "Divide the total sheets by the sheets in each folder: 72 ÷ 8.",
      ["8 folders", "9 folders", "10 folders", "11 folders"]
    ),
    makeChoiceProblem(
      "Intermediate Money",
      "My friend has ₱200. She buys a notebook for ₱45 and two pens for ₱15 each. How much money does she have left?",
      "₱125",
      "Two pens cost 15 × 2. Add the notebook, then subtract that total from ₱200.",
      ["₱115", "₱120", "₱125", "₱130"]
    ),
    makeChoiceProblem(
      "Intermediate Multi-Step",
      "I bought 3 packs of stickers with 12 stickers in each pack. I gave 8 stickers to my friend. How many stickers do I have left?",
      "28 stickers",
      "Multiply packs by stickers per pack (3 × 12), then subtract the 8 you gave away.",
      ["24 stickers", "28 stickers", "30 stickers", "32 stickers"]
    ),
    makeChoiceProblem(
      "Intermediate Multi-Step",
      "My student read 15 pages on Monday and 20 pages on Tuesday. On Wednesday, the student read 10 more pages than Tuesday. How many pages did the student read altogether?",
      "65 pages",
      "Wednesday is Tuesday plus 10 (20 + 10). Then add Monday, Tuesday, and Wednesday.",
      ["55 pages", "60 pages", "65 pages", "70 pages"]
    ),
    makeChoiceProblem(
      "Intermediate Division",
      "I have 48 candies. I put 6 candies in each small bag. After filling as many bags as possible, how many bags can I make?",
      "8 bags",
      "Divide the candies equally into groups of 6: 48 ÷ 6.",
      ["6 bags", "7 bags", "8 bags", "9 bags"]
    ),
    makeChoiceProblem(
      "Intermediate Multi-Step",
      "My co-worker bought 4 boxes of pencils. Each box has 24 pencils. She gave 15 pencils to her students and kept the rest. How many pencils does she have left?",
      "81 pencils",
      "Multiply boxes by pencils per box (4 × 24), then subtract the 15 she gave away.",
      ["81 pencils", "96 pencils", "66 pencils", "79 pencils"]
    ),
  ];
}

function buildAdvancedProblems() {
  return [
    makeChoiceProblem(
      "Advanced Multi-Step",
      "A Grade 6 class is preparing school supply kits for a community project. They have 144 pencils, 108 notebooks, and 72 erasers. Each kit must contain 4 pencils, 3 notebooks, and 2 erasers. The class wants to make as many complete kits as possible and divide them equally among 6 groups. How many complete kits will each group receive?",
      "6 kits",
      "Find how many complete kits the supplies allow: 144 ÷ 4, 108 ÷ 3, and 72 ÷ 2. The smallest of those three amounts is the maximum number of kits. Then divide that many kits equally among 6 groups, counting only complete kits for each group.",
      ["4 kits", "6 kits", "8 kits", "12 kits"]
    ),
    makeChoiceProblem(
      "Advanced Multi-Step",
      "A school canteen prepared 180 sandwiches for a school event. In the morning, 65 sandwiches were sold. During lunch, they sold 2 times as many sandwiches as they sold in the morning. The remaining sandwiches were packed equally into 5 boxes. How many sandwiches were placed in each box?",
      "9 sandwiches",
      "Lunch sales are twice the morning sales (2 × 65). Subtract morning and lunch sales from 180, then divide what is left by 5.",
      ["8 sandwiches", "9 sandwiches", "12 sandwiches", "15 sandwiches"]
    ),
    makeChoiceProblem(
      "Advanced Money",
      "A local community foundation received a grant of ₱15,000.00 to purchase fish seedlings for a coastal livelihood project. They bought 2,500 tilapia fingerlings at ₱3.50 each and 1,800 milkfish (bangus) fingerlings at ₱2.50 each. The remaining money from the grant will be used to buy bags of fish feed priced at ₱350.00 per bag. How many full bags of feed can they buy with the remaining grant?",
      "5 bags",
      "Tilapia cost 2,500 × ₱3.50 and bangus cost 1,800 × ₱2.50. Subtract both from ₱15,000.00, then divide what is left by ₱350.00. Count only full bags.",
      ["3 bags", "4 bags", "5 bags", "6 bags"]
    ),
    makeChoiceProblem(
      "Advanced Money",
      "The Grade 6 class is organizing a reading fair. They start with a budget of ₱5,000.00. They spend ₱1,250.50 on decorations and ₱849.50 on books. During the fair, they sold 75 tickets for ₱40.00 each. They also gave 15 free tickets to teachers. After the event, they spent ₱1,200.00 to buy additional books. The remaining money is divided equally among 4 groups for their next classroom activity. How much money does each group receive?",
      "₱1,175.00",
      "Subtract decorations and the first book cost from ₱5,000.00. Add ticket sales of 75 × ₱40.00 (the 15 free tickets bring in no money). Subtract ₱1,200.00, then divide by 4.",
      ["₱675.00", "₱825.00", "₱1,175.00", "₱2,700.00"]
    ),
    makeChoiceProblem(
      "Advanced Multi-Step",
      "A school club hosted a tree-planting project to help protect their local watershed. On the first day, 45 volunteers planted 12 trees each. On the second day, 30 volunteers planted 15 trees each. At the end of the project, 85 planted trees were found damaged by heavy rain and needed to be replaced. How many healthy planted trees remained?",
      "905 trees",
      "Multiply volunteers by trees each day, add both days, then subtract the 85 damaged trees.",
      ["905 trees", "910 trees", "905 trees", "990 trees"]
    ),
    makeChoiceProblem(
      "Advanced Multi-Step",
      "The school library ordered 12 boxes of books for the annual book fair, with each box containing 25 books. On the first day, students bought 140 books. On the second day, the library received an extra delivery of 45 books, but students bought another 85 books. The librarian wants to divide the remaining books equally onto 4 display tables. How many books will be placed on each display table?",
      "30 books per display table",
      "Multiply boxes by books per box. Subtract the first day's sales, add the extra delivery, subtract the second day's sales, then divide equally by 4 tables.",
      ["10 books per display table", "20 books per display table", "30 books per display table", "40 books per display table"]
    ),
    makeChoiceProblem(
      "Advanced Multi-Step",
      "The cafeteria staff made fresh juice using 8 jugs of apple juice and 6 jugs of orange juice, where each jug contained 500mL. Before serving, the staff poured out 200mL for a taste test. They then added 400mL of sparkling water to the total mixture. Finally, they divided the entire mixture equally into 8 large serving pitchers. How many milliliters of juice mixture are in each pitcher?",
      "900mL in each pitcher",
      "Add the jugs, multiply by 500 mL, subtract 200 mL, add 400 mL, then divide by 8 pitchers.",
      ["900mL in each pitcher", "1000 mL in each pitcher", "1,200 mL in each pitcher", "2,000 mL in each pitcher"]
    ),
    makeChoiceProblem(
      "Advanced Money",
      "The school organized a field trip for 135 students and teachers. Each bus can hold up to 45 passengers. The rental cost for each bus is ₱2,000. To help pay for the trip, the school applied a discount coupon that took ₱600 off the total bus rental cost. If the remaining total cost was split equally among all 135 passengers, how much did each passenger pay for their bus seat?",
      "₱40.00",
      "Divide 135 passengers by 45 to find how many buses are needed. Multiply by ₱2,000, subtract the ₱600 discount, then divide by 135.",
      ["₱35.00", "₱40.00", "₱44.00", "₱45.00"]
    ),
    makeChoiceProblem(
      "Advanced Money",
      "Grade 6 pupils raised money for their annual science fair by selling school merchandise. They sold 15 customized water bottles for ₱8 each and 20 notebooks for ₱5 each. Out of the total money raised, they spent ₱40 on art supplies for posters. They split the remaining money equally among 4 science project groups to buy specialized materials. How much money did each group receive?",
      "₱45 per group",
      "Find bottle sales and notebook sales, add them, subtract ₱40, then divide by 4 groups.",
      ["₱35 per group", "₱45 per group", "₱55 per group", "₱65 per group"]
    ),
    makeChoiceProblem(
      "Advanced Multi-Step",
      "The physical education department bought 5 rolls of blue ribbon and 4 rolls of red ribbon to make award medals. Each roll contains 30 cm of ribbon. The coaches cut off 50 cm of damaged ribbon and discarded it. They then bought an additional 20cm of gold ribbon. If they cut all the remaining ribbons into equal pieces that are 8cm long, how many complete ribbons can they make?",
      "30 complete ribbons",
      "Add the blue and red rolls, multiply by 30 cm, subtract 50 cm, add 20 cm of gold, then divide by 8 cm. Count only complete pieces.",
      ["30 complete ribbons", "40 complete ribbons", "50 complete ribbons", "60 complete ribbons"]
    ),
  ];
}

function buildHardProblems() {
  return [
    makeChoiceProblem(
      "Hard Multi-Step",
      "A sixth-grade class has 120 pencils, 90 notebooks, and 60 erasers. They plan to assemble identical school supply packages that contain 2 pencils, 1 notebook, and 1 eraser in each package, and share the packages evenly among 3 elementary schools. What is the maximum number of full packages that can be created for each school?",
      "20 packages per school",
      "Find how many complete packages the supplies allow: divide pencils by 2, notebooks by 1, and erasers by 1. The limiting supply is the smallest of those three amounts. Then divide that number of packages equally among 3 schools.",
      ["15 packages per school", "18 packages per school", "20 packages per school", "10 packages per school"]
    ),
    makeChoiceProblem(
      "Hard Multi-Step",
      "A bookworm student read 18 pages on Monday, 25 pages on Tuesday, and 32 pages on Wednesday. The student’s book has 120 pages. How many pages does the student still need to read?",
      "45 pages",
      "Pages read: 18 + 25 + 32 = 75 pages. Pages remaining: 120 − 75 = 45 pages.",
      ["24 pages", "45 pages", "30 pages", "32 pages"]
    ),
    makeChoiceProblem(
      "Hard Area",
      "A rectangular school garden is 15 meters long and 8 meters wide. The teacher wants to divide it equally into 4 sections for different plants. What is the area of each section?",
      "30 m² per section",
      "Area of a rectangle is length times width. After you have the whole garden area, divide it equally by 4.",
      ["24 m² per section", "30 m² per section", "35 m² per section", "32 m² per section"]
    ),
    makeChoiceProblem(
      "Hard Money",
      "A Grade 6 class sold 75 tickets for ₱20 each. They used ₱650 of the money to buy materials for their project. The remaining money was divided equally among 5 groups. How much money did each group receive?",
      "₱170 per group",
      "Multiply tickets sold by ₱20, subtract ₱650 for materials, then divide what is left by 5 groups.",
      ["₱150 per group", "₱110 per group", "₱160 per group", "₱170 per group"]
    ),
    makeChoiceProblem(
      "Hard Multi-Step",
      "A classroom has 6 rows with 8 chairs in each row. The teacher removes 5 broken chairs and brings in 12 new chairs. How many usable chairs are there now?",
      "55 usable chairs",
      "Multiply rows by chairs per row, subtract the 5 broken chairs, then add the 12 new chairs.",
      ["55 usable chairs", "45 usable chairs", "30 usable chairs", "32 usable chairs"]
    ),
    makeChoiceProblem(
      "Hard Multi-Step",
      "A teacher bought 96 biscuits for her class. She gave 18 biscuits to each of 4 groups. How many biscuits were left?",
      "24 biscuits",
      "Find how many biscuits were given away (18 × 4), then subtract that from 96.",
      ["24 biscuits", "30 biscuits", "20 biscuits", "22 biscuits"]
    ),
    makeChoiceProblem(
      "Hard Money",
      "I bought 3 notebooks for ₱35 each and a pencil case for ₱85. If I paid ₱250, how much change did I receive?",
      "₱60",
      "Multiply 3 by ₱35, add the pencil case, then subtract the total cost from ₱250.",
      ["₱65", "₱60", "₱56", "₱50"]
    ),
    makeChoiceProblem(
      "Hard Multi-Step",
      "A school garden has 8 rows of plants with 15 plants in each row. If 23 plants died, how many plants are still growing?",
      "97 plants",
      "Multiply rows by plants per row, then subtract the 23 plants that died.",
      ["67 plants", "100 plants", "95 plants", "97 plants"]
    ),
    makeChoiceProblem(
      "Hard Multi-Step",
      "A fruit seller had 125 mangoes. In the morning, she sold 48 mangoes. In the afternoon, she sold 37 more. She packed the remaining mangoes equally into 4 baskets. How many mangoes were in each basket?",
      "10 mangoes per basket",
      "Add the mangoes sold, subtract that from 125, then divide the remainder equally by 4.",
      ["17 mangoes per basket", "15 mangoes per basket", "18 mangoes per basket", "10 mangoes per basket"]
    ),
    makeChoiceProblem(
      "Hard Multi-Step",
      "A family used 18 liters of water for cooking and 25 liters for cleaning in one day. They used 12 liters less for washing clothes than for cleaning. How many liters of water did they use altogether?",
      "56 liters",
      "Washing clothes is 12 liters less than cleaning. Add cooking, cleaning, and washing clothes.",
      ["56 liters", "65 liters", "60 liters", "55 liters"]
    ),
  ];
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

function makeChoiceProblem(topic, problem, correct, hint, answers) {
  return { topic, problem, correct, hint, answers: shuffle([...answers]) };
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
  if (settingsModal) settingsModal.classList.add("hidden");
  const audioToggle = document.getElementById("audioToggle");
  if (audioToggle) {
    audioToggle.classList.toggle("hidden", name === "loading");
  }
}

function requestImmersiveMode() {
  if (document.fullscreenElement || !document.documentElement.requestFullscreen) return;

  document.documentElement.requestFullscreen({ navigationUI: "hide" }).catch(() => {
    // Fullscreen is optional and may be blocked outside a user gesture or in an embedded browser.
  });

  if (screen.orientation && screen.orientation.lock) {
    screen.orientation.lock("landscape").catch(() => {
      // Orientation locking is optional and unsupported on some mobile browsers.
    });
  }
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
  requestImmersiveMode();
  resetGame();
  state.started = true;
  showScreen("game");
  syncTownTheme();
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

// ==================== AUDIO SYSTEM ====================
// START: Audio implementation

const townTheme = new Audio("Audio/TownTheme.mp3");
townTheme.loop = true;
townTheme.preload = "auto";
townTheme.volume = 0.42;

const confettiSound = new Audio("Audio/confetti.mp3");
confettiSound.preload = "auto";
confettiSound.volume = 0.75;

let audioOn = getSavedNumber(AUDIO_STORAGE_KEY, 1) !== 0;

function saveAudioPreference() {
  try {
    localStorage.setItem(AUDIO_STORAGE_KEY, audioOn ? "1" : "0");
  } catch (error) {
    // Preference still applies for the current session if storage is unavailable.
  }
}

function updateAudioToggle() {
  const toggle = document.getElementById("audioToggle");
  const settingsAudioButton = document.getElementById("settingsAudioButton");
  if (!toggle) return;

  toggle.textContent = audioOn ? "Sound On" : "Sound Off";
  toggle.setAttribute("aria-pressed", audioOn ? "true" : "false");
  toggle.setAttribute(
    "aria-label",
    audioOn ? "Turn audio off" : "Turn audio on"
  );
  if (settingsAudioButton) {
    settingsAudioButton.textContent = audioOn ? "Sound On" : "Sound Off";
    settingsAudioButton.setAttribute("aria-pressed", audioOn ? "true" : "false");
  }
}

function syncTownTheme() {
  // The music NEVER pauses and NEVER resets.
  // When audio is OFF, it continues playing silently.
  townTheme.volume = audioOn ? 0.42 : 0;

  const playPromise = townTheme.play();

  if (playPromise) {
    playPromise.catch(() => {});
  }
}

function toggleAudio() {
  audioOn = !audioOn;

  saveAudioPreference();
  updateAudioToggle();
  syncTownTheme();
}

function openSettings() {
  if (!settingsModal) return;
  settingsModal.classList.remove("hidden");
}

function closeSettings() {
  if (!settingsModal) return;
  settingsModal.classList.add("hidden");
}

function resetSavedProgress() {
  try {
    localStorage.removeItem(POINTS_STORAGE_KEY);
    localStorage.removeItem(HINTS_STORAGE_KEY);
    localStorage.removeItem(REWARD_STORAGE_KEY);
  } catch (error) {
    // The current session can still reset even when browser storage is blocked.
  }
  state.score = 0;
  state.hintsAvailable = STARTING_HINTS;
  state.rewardUnlocked = false;
  updateHud();
  showToast("Saved points, hints, and reward were reset.");
  closeSettings();
}

function playConfettiSound() {
  if (!audioOn) return;

  confettiSound.currentTime = 0;

  const playPromise = confettiSound.play();

  if (playPromise) {
    playPromise.catch(() => {});
  }
}

// END: Audio implementation
// =====================================================

function playConfetti() {
  playConfettiSound();
  const layer = document.getElementById("confettiLayer");
  if (!layer || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  clearTimeout(playConfetti.timer);
  clearInterval(playConfetti.wave);
  layer.innerHTML = "";

  const colors = ["#f6bd2f", "#38b66b", "#2f80ed", "#f05d5e", "#ff9ab3", "#fff07a", "#65d6ff", "#ffffff"];
  const startedAt = performance.now();
  const partyMs = 2000;

  function spawnPiece(kind) {
    const piece = document.createElement("span");
    const size = 7 + Math.random() * 10;
    const shape = Math.random();
    piece.className = "confetti-piece";
    if (shape > 0.72) piece.classList.add("round");
    else if (shape > 0.45) piece.classList.add("ribbon");
    piece.style.setProperty("--w", `${size}px`);
    piece.style.setProperty("--h", `${shape > 0.45 && shape <= 0.72 ? size * 2.2 : 5 + Math.random() * 10}px`);
    piece.style.setProperty("--c", colors[Math.floor(Math.random() * colors.length)]);
    piece.style.setProperty("--dur", `${1200 + Math.random() * 900}ms`);
    piece.style.setProperty("--delay", `${Math.random() * 80}ms`);
    piece.style.setProperty("--spin", `${(Math.random() > 0.5 ? 1 : -1) * (480 + Math.random() * 720)}deg`);

    if (kind === "fall") {
      piece.style.setProperty("--x", `${Math.random() * 100}%`);
      piece.style.setProperty("--dx", `${(Math.random() - 0.5) * 220}px`);
    } else {
      piece.classList.add("burst");
      piece.style.setProperty("--x", `${kind.x}%`);
      piece.style.setProperty("--y", `${kind.y}%`);
      piece.style.setProperty("--dx", `${(Math.random() - 0.5) * window.innerWidth * 0.9}px`);
      piece.style.setProperty("--up", `${-40 - Math.random() * 140}px`);
      piece.style.setProperty("--dy", `${80 + Math.random() * window.innerHeight * 0.7}px`);
    }

    piece.addEventListener("animationend", () => piece.remove());
    layer.appendChild(piece);
  }

  function spawnWave() {
    for (let i = 0; i < 42; i += 1) spawnPiece("fall");
    [
      { x: 50, y: 38 },
      { x: 8, y: 58 },
      { x: 92, y: 58 },
    ].forEach((cannon) => {
      for (let i = 0; i < 18; i += 1) spawnPiece(cannon);
    });
  }

  spawnWave();
  playConfetti.wave = setInterval(() => {
    if (performance.now() - startedAt >= partyMs) {
      clearInterval(playConfetti.wave);
      return;
    }
    spawnWave();
  }, 160);

  playConfetti.timer = setTimeout(() => {
    clearInterval(playConfetti.wave);
    layer.innerHTML = "";
  }, 4200);
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

  const sky = ctx.createLinearGradient(0, 0, 0, world.height);
  sky.addColorStop(0, "#72d9ff");
  sky.addColorStop(0.45, "#d8f7ff");
  sky.addColorStop(0.68, "#fff0a7");
  sky.addColorStop(1, "#69d95f");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, world.width, world.height);

  drawBackdrop();
  drawPaths();
  drawFlowers();
  objects.forEach(drawObject);
  quests.forEach((quest, index) => drawNpcPolished(quest, index));
  drawPlayerPolished();

  ctx.restore();
}

function drawBackdrop() {
  ctx.fillStyle = "rgba(255,255,255,0.82)";
  [
    [130, 90, 90, 32],
    [205, 82, 64, 26],
    [780, 110, 120, 38],
    [890, 106, 86, 31],
    [1670, 94, 130, 40],
    [1780, 104, 96, 34],
  ].forEach(([x, y, w, h]) => {
    ctx.beginPath();
    ctx.ellipse(x, y, w, h, 0, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.fillStyle = "rgba(95, 182, 226, 0.55)";
  ctx.beginPath();
  ctx.moveTo(0, 285);
  ctx.bezierCurveTo(240, 160, 330, 265, 540, 185);
  ctx.bezierCurveTo(710, 120, 830, 265, 1040, 190);
  ctx.bezierCurveTo(1260, 110, 1450, 250, 1660, 180);
  ctx.bezierCurveTo(1890, 105, 2070, 235, 2550, 165);
  ctx.lineTo(world.width, 380);
  ctx.lineTo(0, 380);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#7ddf66";
  ctx.beginPath();
  ctx.moveTo(0, 315);
  ctx.bezierCurveTo(250, 255, 460, 325, 710, 282);
  ctx.bezierCurveTo(1000, 230, 1180, 332, 1480, 275);
  ctx.bezierCurveTo(1790, 216, 2100, 325, 2550, 252);
  ctx.lineTo(world.width, world.height);
  ctx.lineTo(0, world.height);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#51c756";
  ctx.beginPath();
  ctx.moveTo(0, 560);
  ctx.bezierCurveTo(440, 500, 780, 590, 1210, 535);
  ctx.bezierCurveTo(1660, 476, 2050, 575, 2550, 500);
  ctx.lineTo(world.width, world.height);
  ctx.lineTo(0, world.height);
  ctx.closePath();
  ctx.fill();

  const lake = ctx.createLinearGradient(0, 250, 0, 455);
  lake.addColorStop(0, "rgba(59, 194, 239, 0.76)");
  lake.addColorStop(1, "rgba(27, 143, 218, 0.62)");
  ctx.fillStyle = lake;
  ctx.beginPath();
  ctx.ellipse(1980, 380, 380, 86, -0.08, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.62)";
  ctx.lineWidth = 5;
  for (let i = 0; i < 4; i += 1) {
    ctx.beginPath();
    ctx.moveTo(1670 + i * 150, 360 + i * 11);
    ctx.quadraticCurveTo(1740 + i * 150, 345 + i * 10, 1820 + i * 150, 360 + i * 9);
    ctx.stroke();
  }
}

function drawPaths() {
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const roads = [
    { label: "Easy", color: "#ffe7a1", points: [[80, 430], [350, 300], [520, 380]] },
    { label: "Medium", color: "#ffd47a", points: [[520, 380], [750, 450], [920, 360]] },
    { label: "Intermediate", color: "#ffc06f", points: [[920, 360], [1120, 420], [1360, 560]] },
    { label: "Hard", color: "#f3a867", points: [[1360, 560], [1570, 350], [1840, 300]] },
    { label: "Advanced", color: "#e99261", points: [[1840, 300], [2070, 360], [2380, 500]] },
  ];

  roads.forEach((road) => {
    ctx.strokeStyle = "rgba(131, 92, 31, 0.24)";
    ctx.lineWidth = 76;
    ctx.beginPath();
    ctx.moveTo(road.points[0][0], road.points[0][1]);
    ctx.quadraticCurveTo(road.points[1][0], road.points[1][1], road.points[2][0], road.points[2][1]);
    ctx.stroke();

    ctx.strokeStyle = "#c99041";
    ctx.lineWidth = 62;
    ctx.stroke();

    ctx.strokeStyle = road.color;
    ctx.lineWidth = 42;
    ctx.stroke();

    ctx.strokeStyle = "rgba(255,255,255,0.44)";
    ctx.lineWidth = 5;
    ctx.setLineDash([24, 20]);
    ctx.stroke();
    ctx.setLineDash([]);

    const labelX = (road.points[0][0] + road.points[2][0]) / 2;
    const labelY = (road.points[0][1] + road.points[2][1]) / 2 - 42;
    const labelWidth = road.label === "Intermediate" ? 134 : 96;
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.strokeStyle = "rgba(21, 91, 153, 0.28)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(labelX - labelWidth / 2, labelY - 18, labelWidth, 34, 17);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#16466f";
    ctx.font = "950 14px Trebuchet MS, system-ui";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(road.label, labelX, labelY);
  });
}

function drawFlowers() {
  for (let i = 0; i < 96; i += 1) {
    const x = 70 + ((i * 173) % 2380);
    const y = 80 + ((i * 97) % 730);
    if (Math.abs(y - 430) < 42) continue;
    const petal = i % 3 === 0 ? "#ff6d9f" : i % 3 === 1 ? "#fff06a" : "#ffffff";
    ctx.fillStyle = petal;
    ctx.beginPath();
    ctx.arc(x - 4, y, 4, 0, Math.PI * 2);
    ctx.arc(x + 4, y, 4, 0, Math.PI * 2);
    ctx.arc(x, y - 4, 4, 0, Math.PI * 2);
    ctx.arc(x, y + 4, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffd43b";
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawObject(obj) {
  if (obj.type === "house") {
    ctx.fillStyle = "rgba(21, 61, 63, 0.18)";
    ctx.beginPath();
    ctx.ellipse(obj.x + obj.w / 2, obj.y + obj.h + 8, obj.w * 0.58, 16, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = obj.wall;
    ctx.beginPath();
    ctx.roundRect(obj.x, obj.y + 38, obj.w, obj.h - 38, 12);
    ctx.fill();
    ctx.strokeStyle = "rgba(92, 61, 43, 0.18)";
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.fillStyle = obj.roof;
    ctx.beginPath();
    ctx.moveTo(obj.x - 12, obj.y + 44);
    ctx.lineTo(obj.x + obj.w / 2, obj.y);
    ctx.lineTo(obj.x + obj.w + 12, obj.y + 44);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "rgba(91, 49, 36, 0.24)";
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.fillStyle = "#7a5136";
    ctx.beginPath();
    ctx.roundRect(obj.x + obj.w / 2 - 15, obj.y + obj.h - 42, 30, 42, 8);
    ctx.fill();

    ctx.fillStyle = "#87cffd";
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 3;
    [obj.x + 18, obj.x + obj.w - 48].forEach((wx) => {
      ctx.beginPath();
      ctx.roundRect(wx, obj.y + 60, 30, 26, 6);
      ctx.fill();
      ctx.stroke();
    });
    return;
  }

  if (obj.type === "tree") {
    ctx.fillStyle = "rgba(21, 61, 63, 0.14)";
    ctx.beginPath();
    ctx.ellipse(obj.x, obj.y + 56, 42, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#8a5a35";
    ctx.beginPath();
    ctx.roundRect(obj.x - 9, obj.y + 12, 18, 44, 8);
    ctx.fill();

    ctx.fillStyle = "#257f43";
    ctx.beginPath();
    ctx.arc(obj.x, obj.y, 34, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#39b957";
    ctx.beginPath();
    ctx.arc(obj.x - 17, obj.y + 4, 20, 0, Math.PI * 2);
    ctx.arc(obj.x + 18, obj.y - 2, 22, 0, Math.PI * 2);
    ctx.arc(obj.x + 2, obj.y - 18, 22, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(255,255,255,0.18)";
    ctx.beginPath();
    ctx.arc(obj.x - 15, obj.y - 10, 8, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  if (obj.type === "well") {
    ctx.fillStyle = "rgba(21, 61, 63, 0.16)";
    ctx.beginPath();
    ctx.ellipse(obj.x, obj.y + 24, 40, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#a7b7c4";
    ctx.beginPath();
    ctx.roundRect(obj.x - 28, obj.y - 13, 56, 38, 8);
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = "#667d8d";
    ctx.beginPath();
    ctx.roundRect(obj.x - 34, obj.y - 25, 68, 14, 7);
    ctx.fill();
    ctx.fillStyle = "#39c7ff";
    ctx.beginPath();
    ctx.ellipse(obj.x, obj.y - 3, 19, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  ctx.fillStyle = "#b9773e";
  ctx.beginPath();
  ctx.roundRect(obj.x - 22, obj.y - 18, 44, 38, 6);
  ctx.fill();
  ctx.strokeStyle = "#7a4a2c";
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.strokeStyle = "rgba(255,255,255,0.32)";
  ctx.beginPath();
  ctx.moveTo(obj.x - 17, obj.y - 5);
  ctx.lineTo(obj.x + 17, obj.y - 5);
  ctx.stroke();
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

function drawNpcPolished(quest, index) {
  const locked = index > state.questIndex;
  const completed = index < state.questIndex;
  const bob = Math.sin(performance.now() / 360 + index) * 3;
  const x = quest.x;
  const y = quest.y + bob;
  ctx.globalAlpha = locked ? 0.38 : 1;

  ctx.fillStyle = "rgba(17,54,63,0.16)";
  ctx.beginPath();
  ctx.ellipse(x, quest.y + 27, 28, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = quest.color;
  ctx.beginPath();
  ctx.arc(x, y - 9, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.24)";
  ctx.beginPath();
  ctx.arc(x - 8, y - 17, 7, 0, Math.PI * 2);
  ctx.fill();

  const bodyGradient = ctx.createLinearGradient(x, y + 10, x, y + 50);
  bodyGradient.addColorStop(0, "#315e90");
  bodyGradient.addColorStop(1, "#173e68");
  ctx.fillStyle = bodyGradient;
  ctx.beginPath();
  ctx.roundRect(x - 18, y + 12, 36, 36, 10);
  ctx.fill();

  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(x - 7, y - 12, 4, 0, Math.PI * 2);
  ctx.arc(x + 7, y - 12, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#16345c";
  ctx.beginPath();
  ctx.arc(x - 6, y - 12, 2, 0, Math.PI * 2);
  ctx.arc(x + 8, y - 12, 2, 0, Math.PI * 2);
  ctx.fill();

  if (!completed) {
    ctx.fillStyle = locked ? "#7f91a2" : "#ffd83d";
    ctx.beginPath();
    ctx.arc(x + 28, y - 52, 17, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.78)";
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.fillStyle = locked ? "#dbe4ea" : "#573400";
    ctx.font = "950 23px Trebuchet MS, system-ui";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(locked ? "?" : quest.icon, x + 28, y - 53);
  } else {
    drawCheckIconPolished(x + 28, y - 44);
  }

  ctx.fillStyle = "rgba(255,255,255,0.86)";
  ctx.beginPath();
  ctx.roundRect(x - 42, y + 52, 84, 25, 13);
  ctx.fill();
  ctx.fillStyle = "#17324a";
  ctx.font = "950 15px Trebuchet MS, system-ui";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(quest.npc, x, y + 65);
  ctx.globalAlpha = 1;
}

function drawCheckIconPolished(x, y) {
  ctx.fillStyle = "#21b26b";
  ctx.beginPath();
  ctx.arc(x, y, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.78)";
  ctx.lineWidth = 4;
  ctx.stroke();

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

function drawPlayerPolished() {
  drawPlayerPointerPolished();
  const step = Math.sin(performance.now() / 120) * 2;

  ctx.fillStyle = "rgba(17,54,63,0.18)";
  ctx.beginPath();
  ctx.ellipse(player.x, player.y + 22, 24, 9, 0, 0, Math.PI * 2);
  ctx.fill();

  if (state.rewardUnlocked) {
    ctx.fillStyle = "#ffd33d";
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

  const shirt = ctx.createLinearGradient(player.x, player.y, player.x, player.y + 38);
  shirt.addColorStop(0, "#34caff");
  shirt.addColorStop(1, "#176fd4");
  ctx.fillStyle = shirt;
  ctx.beginPath();
  ctx.roundRect(player.x - 15, player.y + 1, 30, 34, 9);
  ctx.fill();

  ctx.fillStyle = "#ffd5a5";
  ctx.beginPath();
  ctx.arc(player.x, player.y - 12, 17, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#51331e";
  ctx.beginPath();
  ctx.roundRect(player.x - 17, player.y - 25, 34, 12, 6);
  ctx.fill();

  if (state.rewardUnlocked) {
    ctx.fillStyle = "#ffd33d";
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
  ctx.fillStyle = "#16345c";
  ctx.beginPath();
  ctx.arc(player.x - 5, player.y - 12, 1.5, 0, Math.PI * 2);
  ctx.arc(player.x + 7, player.y - 12, 1.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#16345c";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(player.x + 1, player.y - 7, 5, 0.15, Math.PI - 0.15);
  ctx.stroke();

  ctx.strokeStyle = "#16466f";
  ctx.lineWidth = 5;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(player.x - 8, player.y + 33);
  ctx.lineTo(player.x - 12, player.y + 46 + step);
  ctx.moveTo(player.x + 8, player.y + 33);
  ctx.lineTo(player.x + 12, player.y + 46 - step);
  ctx.stroke();
}

function drawPlayerPointerPolished() {
  const bob = Math.sin(performance.now() / 220) * 4;
  const x = player.x;
  const y = player.y - 76 + bob;

  ctx.fillStyle = "rgba(23, 50, 74, 0.16)";
  ctx.beginPath();
  ctx.ellipse(x, y + 6, 18, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#ffd83d";
  ctx.strokeStyle = "#ffffff";
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
  ctx.strokeStyle = "#9b6500";
  ctx.lineWidth = 2;
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
  document.getElementById("audioToggle").classList.add("hidden");
  const quest = quests[state.questIndex];
  state.chancesLeft = 2;
  document.getElementById("challengeLevel").textContent = `Level ${state.questIndex + 1} of ${quests.length}`;
  document.getElementById("challengeTopic").textContent = `${quest.levelName} - ${quest.topic}`;

  const questionImage = document.getElementById("questionImage");
  if (questionImage) {
    questionImage.onerror = () => {
      questionImage.classList.add("hidden");
      questionImage.removeAttribute("src");
    };

    if (quest.image) {
      questionImage.src = quest.image;
      questionImage.alt = `Illustration for ${quest.topic}`;
      questionImage.classList.remove("hidden");
    } else {
      questionImage.classList.add("hidden");
      questionImage.removeAttribute("src");
      questionImage.alt = "";
    }
  }

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
    playConfetti();
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
    document.getElementById("audioToggle").classList.remove("hidden");
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
    document.getElementById("audioToggle").classList.remove("hidden");
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
  document.getElementById("audioToggle").classList.remove("hidden");
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

document.getElementById("audioToggle").addEventListener("click", toggleAudio);
document.getElementById("startButton").addEventListener("click", startGame);
document.getElementById("settingsButton").addEventListener("click", openSettings);
document.getElementById("settingsCloseButton").addEventListener("click", closeSettings);
document.getElementById("settingsAudioButton").addEventListener("click", toggleAudio);
document.getElementById("settingsResetButton").addEventListener("click", resetSavedProgress);
document.getElementById("playAgainButton").addEventListener("click", startGame);
document.getElementById("backToMenuButton").addEventListener("click", () => {
  state.started = false;
  showScreen("menu");
  showToast("Returned to the main menu.");
});
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
window.addEventListener("load", () => {
  if (loadingFill && loadingPercent) {
    let progress = 0;
    const totalSteps = 100;
    const stepMs = 55;

    const tick = () => {
      progress += 1;
      loadingFill.style.width = `${progress}%`;
      loadingPercent.textContent = `${progress}%`;

      if (progress < totalSteps) {
        setTimeout(tick, stepMs);
        return;
      }

      setTimeout(() => {
        if (!state.started && !screens.loading.classList.contains("hidden")) {
          showScreen("menu");
        }
      }, 300);
    };

    setTimeout(tick, 140);
  } else {
    setTimeout(() => {
      if (!state.started && !screens.loading.classList.contains("hidden")) {
        showScreen("menu");
      }
    }, 900);
  }
});

resizeCanvas();
setupJoystick();
updateHud();
updateAudioToggle();
showScreen("loading");
requestAnimationFrame(gameLoop);
