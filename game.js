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
  return [
    makeChoiceProblem(
      "Easy Temperature",
      "The highest temperature today was 8°C and the lowest was -3°C. What was the difference in temperature?",
      "11°C",
      "Difference means highest minus lowest. Going from a negative temperature up to a positive one means adding the two amounts: 8 − (−3) = 8 + 3.",
      ["5°C", "11°C", "-11°C", "10°C"]
    ),
    makeChoiceProblem(
      "Easy Subtraction",
      "A store had 3,000 items in stock and sold 1,284 items during a sale. How many items remain?",
      "1,716 items",
      "Subtract the items sold from the items in stock: 3,000 − 1,284. Borrow carefully from the thousands.",
      ["1,716 items", "1,826 items", "2,716 items", "1,684 items"]
    ),
    makeChoiceProblem(
      "Easy Fractions",
      "A water tank contained 5/6 of a liter of water. After using 1/2 liter, how much water is left?",
      "1/3 liter",
      "Subtract 1/2 from 5/6. Use 6 as a common denominator: 1/2 = 3/6, then 5/6 − 3/6. Simplify the result.",
      ["1/3 liter", "2/3 liter", "1/2 liter", "1/6 liter"]
    ),
    makeChoiceProblem(
      "Easy Money",
      "A family has $250.00 budgeted for groceries and spends $178.65. How much money is left?",
      "$71.35",
      "Subtract $178.65 from $250.00. Line up the decimal points and subtract hundredths, tenths, then dollars.",
      ["$71.35", "$72.35", "$81.35", "$70.35"]
    ),
    makeChoiceProblem(
      "Easy Decimals",
      "A ribbon is 7.5 m long. A tailor cuts off 2.85 m. How much ribbon is left?",
      "4.65 m",
      "Subtract 2.85 from 7.5. Write 7.5 as 7.50 so the hundredths place lines up, then subtract.",
      ["4.75 m", "5.65 m", "4.65 m", "4.35 m"]
    ),
    makeChoiceProblem(
      "Easy Addition",
      "The library has 4,286 fiction books and 2,759 nonfiction books. How many books does the library have in total?",
      "7,045",
      "Add 4,286 and 2,759. Add ones, tens, hundreds, then thousands, and carry whenever a column is 10 or more.",
      ["6,045", "7,045", "7,145", "6,935"]
    ),
    makeChoiceProblem(
      "Easy Decimals",
      "A cyclist rode 12.65 km on Monday and 8.9 km on Tuesday. How far did she ride altogether?",
      "21.55 km",
      "Add 12.65 and 8.9. Write 8.9 as 8.90 so the decimal points line up, then add.",
      ["21.55 km", "20.55 km", "21.65 km", "22.45 km"]
    ),
    makeChoiceProblem(
      "Easy Fractions",
      "A recipe calls for 3/4 cup of milk and 2/3 cup of water. What is the total amount of liquid needed?",
      "1 5/12 cups",
      "Add 3/4 and 2/3. Use 12 as a common denominator: 3/4 = 9/12 and 2/3 = 8/12. Add the numerators, then write any improper fraction as a mixed number.",
      ["5/7 cup", "1 5/12 cups", "1 1/4 cups", "5/12 cup"]
    ),
    makeChoiceProblem(
      "Easy Addition",
      "A farmer harvested 1,250 kg of corn, 875 kg of wheat, and 1,475 kg of rice. How many kilograms of grain did he harvest in all?",
      "3,600 kg",
      "Add all three harvests: 1,250 + 875 + 1,475. Add two amounts first, then add the third.",
      ["3,500 kg", "3,600 kg", "2,600 kg", "3,700 kg"]
    ),
    makeChoiceProblem(
      "Easy Money",
      "My friend saved ₱245.75 from her allowance, ₱189.50 from selling snacks, and ₱320.25 from her birthday money. How much money does she have in total?",
      "₱755.50",
      "Add the three amounts. Line up the pesos and centavos, add the centavos first, then the pesos.",
      ["₱745.50", "₱755.50", "₱755.00", "₱765.50"]
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
      "There are 7 rows of chairs in the classroom. Each row has 5 chairs. How many chairs are there altogether?",
      "35 chairs",
      "Multiply the number of rows by the chairs in each row: 7 × 5.",
      ["30 chairs", "35 chairs", "40 chairs", "45 chairs"]
    ),
    makeChoiceProblem(
      "Medium Multiplication",
      "A library receives 6 boxes of books. Each box contains 7 books. How many books did the library receive?",
      "42 books",
      "Multiply the number of boxes by the books in each box: 6 × 7.",
      ["40 books", "32 books", "42 books", "22 books"]
    ),
    makeChoiceProblem(
      "Medium Multiplication",
      "The teacher prepared 5 sets of school supplies for her students. Each set has 4 pencils. How many pencils did the teacher prepare altogether?",
      "20 pencils",
      "Multiply the number of sets by the pencils in each set: 5 × 4.",
      ["15 pencils", "25 pencils", "30 pencils", "20 pencils"]
    ),
    makeChoiceProblem(
      "Medium Multiplication",
      "During a school activity, 7 students each received 3 sheets of paper. How many sheets of paper were given to the students altogether?",
      "21 sheets of paper",
      "Each of the 7 students got 3 sheets, so multiply 7 × 3.",
      ["21 sheets of paper", "22 sheets of paper", "23 sheets of paper", "24 sheets of paper"]
    ),
    makeChoiceProblem(
      "Medium Division",
      "The classroom has 24 storybooks. The teacher wants to place them equally on 6 shelves. How many storybooks should be placed on each shelf?",
      "4 storybooks per shelf",
      "Share 24 storybooks equally across 6 shelves. Divide 24 by 6.",
      ["3 storybooks per shelf", "5 storybooks per shelf", "6 storybooks per shelf", "4 storybooks per shelf"]
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
      "A Grade 6 class is preparing school supply kits for a community project. They have 144 pencils, 96 notebooks, and 72 erasers. Each kit must contain 4 pencils, 3 notebooks, and 2 erasers. The class wants to make as many complete kits as possible and divide them equally among 6 groups. How many complete kits will each group receive?",
      "5 kits",
      "Find how many complete kits the supplies allow: 144 ÷ 4, 96 ÷ 3, and 72 ÷ 2. The smallest of those three amounts is the maximum number of kits. Then divide that many kits equally among 6 groups, counting only complete kits for each group.",
      ["4 kits", "5 kits", "6 kits", "8 kits"]
    ),
    makeChoiceProblem(
      "Advanced Multi-Step",
      "A school canteen prepared 180 sandwiches for a school event. In the morning, 65 sandwiches were sold. During lunch, they sold 2 times as many sandwiches as they sold in the morning. The remaining sandwiches were packed equally into 5 boxes. How many sandwiches were placed in each box?",
      "10 sandwiches",
      "Lunch sales are twice the morning sales (2 × 65). Subtract morning and lunch sales from 180, then divide what is left by 5. If those two sales add up to more than 180, the numbers in the problem need to be checked.",
      ["8 sandwiches", "10 sandwiches", "12 sandwiches", "15 sandwiches"]
    ),
    makeChoiceProblem(
      "Advanced Perimeter",
      "A rectangular school garden is 18 meters long and 10 meters wide. The class wants to divide the garden into 6 equal sections. Each section will be planted with a different vegetable. They also want to put a fence around the entire garden. If each meter of fencing costs ₱45, how much will the fencing cost?",
      "₱2,520",
      "The fence goes around the whole garden, so use perimeter: 2 × (length + width). Then multiply that length by ₱45. Splitting the garden into sections does not change the outer fence.",
      ["₱1,890", "₱2,250", "₱2,520", "₱2,700"]
    ),
    makeChoiceProblem(
      "Advanced Money",
      "The Grade 6 class is organizing a reading fair. They have ₱5,000 as their starting budget. They spend ₱1,250 on decorations and ₱850 on books. During the fair, they sell 75 tickets for ₱40 each. However, they give 15 free tickets to teachers. After the event, they use ₱1,200 to buy additional books. The remaining money is divided equally among 4 groups for their next classroom activity. How much money does each group receive?",
      "₱1,175",
      "Subtract decorations and the first book cost from ₱5,000. Add ticket sales of 75 × ₱40 (the 15 free tickets bring in no money). Subtract ₱1,200, then divide by 4.",
      ["₱725", "₱1,175", "₱775", "₱800"]
    ),
    makeChoiceProblem(
      "Advanced Multi-Step",
      "Maria saved ₱1,500 for a school project. She spent ₱375 on art materials and ₱240 on printing. Her teacher then gave her ₱500 to help with the project. Maria used 1/3 of the money she had at that point to buy snacks for the group. How much money did she have left?",
      "₱923.33",
      "Subtract the two purchases from ₱1,500, then add ₱500. She spends one third of that amount, so two thirds remain.",
      ["₱890", "₱920", "₱923.33", "₱940"]
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
      "The school organized a field trip for 135 students and teachers. Each bus can hold up to 45 passengers. The rental cost for each bus is ₱1200. To help pay for the trip, the school applied a discount coupon that took ₱600 off the total bus rental cost. If the remaining total cost was split equally among all 135 passengers, how much did each passenger pay for their bus seat?",
      "22.2 per passenger",
      "Divide 135 passengers by 45 to find how many buses are needed. Multiply by ₱1200, subtract the ₱600 discount, then divide by 135.",
      ["20.2 per passenger", "21.2 per passenger", "22.2 per passenger", "23.2 per passenger"]
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
      "Joshua read 18 pages on Monday, 25 pages on Tuesday, and 32 pages on Wednesday. His book has 120 pages. How many pages does Joshua still need to read?",
      "45 pages",
      "Add the pages already read, then subtract that total from 120.",
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
