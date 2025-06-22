const wordDisplay = document.getElementById("word-display") as HTMLParagraphElement;
const typedInput = document.getElementById("typed-word") as HTMLInputElement;
const timeDisplay = document.getElementById("time") as HTMLSpanElement;
const scoreDisplay = document.getElementById("score") as HTMLSpanElement;
const restartBtn = document.getElementById("restart-btn") as HTMLButtonElement;
const startBtn = document.getElementById("start-btn") as HTMLButtonElement;
const difficultySelect = document.getElementById("difficulty") as HTMLSelectElement;
const highScoreDisplay = document.getElementById("high-score") as HTMLSpanElement;
const difficultyLabel = document.getElementById("difficulty-label") as HTMLSpanElement;

let wordList: string[] = [];
let shuffledWords: string[] = [];
let wordIndex = 0;
let currentWord = '';
let score = 0;
let time = 10;
let timerInterval: number;
let highScores: Record<string, number> = {
  easy: Number(localStorage.getItem("typingHighScore_easy")) || 0,
  medium: Number(localStorage.getItem("typingHighScore_medium")) || 0,
  hard: Number(localStorage.getItem("typingHighScore_hard")) || 0,
};

const tickSound = new Audio("sounds/tick.wav");
const gameOverSound = new Audio("sounds/gameover.mp3");
const wordMemory: string[] = [];
const memoryLimit = 3; 


async function loadWords() {
  try {
    const response = await fetch("src/words.json");
    const data = await response.json();
    const difficulty = difficultySelect.value;
    wordList = data[difficulty];
    shuffledWords = shuffleWords(wordList);
    wordIndex = 0;
  } catch (error) {
    console.error("Error loading words:", error);
  }
}

function shuffleWords(words: string[]): string[] {
  const array = [...words];
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function getRandomWord(): string {
  if (wordList.length === 0) return "";

  let word: string;
  let tries = 0;

  do {
    word = wordList[Math.floor(Math.random() * wordList.length)];
    tries++;
  } while (wordMemory.includes(word) && tries < 100);

  wordMemory.push(word);
  if (wordMemory.length > memoryLimit) {
    wordMemory.shift();
  }

  return word;
}


function displayNewWord() {
  currentWord = getRandomWord();
  wordDisplay.textContent = currentWord;
  typedInput.value = '';
}

function getTimeBonus(): number {
  const level = difficultySelect.value;
  return level === "easy" ? 5 : level === "medium" ? 3 : 2;
}

function updateTime() {
  timeDisplay.textContent = time.toString();
}

function updateScore() {
  scoreDisplay.textContent = score.toString();
}

function updateHighScore() {
  const difficulty = difficultySelect.value;
  if (score > highScores[difficulty]) {
    highScores[difficulty] = score;
    localStorage.setItem(`typingHighScore_${difficulty}`, score.toString());
  }
  updateHighScoreDisplay();
}

function updateHighScoreDisplay() {
  const difficulty = difficultySelect.value;
  highScoreDisplay.textContent = highScores[difficulty].toString();
  difficultyLabel.textContent = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
}

function endGame() {
  if (timerInterval) clearInterval(timerInterval);
  tickSound.pause();
  tickSound.currentTime = 0;

  gameOverSound.play();
  wordDisplay.textContent = "Game Over!";
  typedInput.disabled = true;
  restartBtn.style.display = "inline-block";
  startBtn.style.display = "none";

  updateHighScore();
}

function playTick() {
  tickSound.currentTime = 0;
  tickSound.play();
}

async function startGame() {
  await loadWords();

  score = 0;
  time = 10;
  updateScore();
  updateTime();
  displayNewWord();
  typedInput.disabled = false;
  typedInput.focus();
  wordDisplay.style.display = "block";

  startBtn.style.display = "none";
  restartBtn.style.display = "none";

  if (timerInterval) clearInterval(timerInterval);

  timerInterval = window.setInterval(() => {
    time--;
    updateTime();

    if (time <= 0) {
      endGame();
      return;
    }

    playTick();
  }, 1000);
}

typedInput.addEventListener("input", () => {
  if (typedInput.value === currentWord) {
    score++;
    time += getTimeBonus();
    updateScore();
    displayNewWord();
  }
});

startBtn.disabled = true;
typedInput.disabled = true;
wordDisplay.style.display = "none";

difficultySelect.addEventListener("change", () => {
  startBtn.disabled = false;
  updateHighScoreDisplay();
});

startBtn.addEventListener("click", () => {
  startGame();
});

restartBtn.addEventListener("click", () => {
  startGame();
});

window.addEventListener("load", () => {
  loadWords();
  updateHighScoreDisplay();
});
