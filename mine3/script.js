const missSound = document.getElementById("missSound");
const openSound = document.getElementById("openSound");
const flagSound = document.getElementById("flagSound");
const clearSound = document.getElementById("clearSound");
const rewardVideoFile = "reward.mp4";

const SIZE = 9;
const MINE_COUNT = 10;
const MAX_HINT = 30;

const stages = [
  "stage1.jpg",
  "stage2.jpg",
  "stage3.jpg",
  "stage4.jpg"
];

const rewardImage = "reward.jpg";

const game = document.getElementById("game");
const bgLayer = document.getElementById("bgLayer");
const message = document.getElementById("message");
const resetBtn = document.getElementById("reset");

let board = [];
let gameOver = false;
let currentStage = 0;
hintCount = MAX_HINT;

function init() {
  bgLayer.style.filter = "brightness(1)";

  game.innerHTML = "";
  board = [];
  gameOver = false;
  hintCount = MAX_HINT;

  message.textContent = `ステージ ${currentStage + 1}　ヒント残り: ${hintCount}`;

  bgLayer.style.backgroundImage = `url(${stages[currentStage]})`;

  for (let y = 0; y < SIZE; y++) {
    board[y] = [];
    for (let x = 0; x < SIZE; x++) {
      board[y][x] = {
        mine: false,
        open: false,
        flag: false,
        count: 0
      };
    }
  }

  let placed = 0;
  while (placed < MINE_COUNT) {
    let x = Math.floor(Math.random() * SIZE);
    let y = Math.floor(Math.random() * SIZE);
    if (!board[y][x].mine) {
      board[y][x].mine = true;
      placed++;
    }
  }

  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      if (board[y][x].mine) continue;
      let count = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          let ny = y + dy;
          let nx = x + dx;
          if (
            ny >= 0 && ny < SIZE &&
            nx >= 0 && nx < SIZE &&
            board[ny][nx].mine
          ) count++;
        }
      }
      board[y][x].count = count;
    }
  }

  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const cell = document.createElement("div");
      cell.classList.add("cell");

      // PCクリック
      cell.addEventListener("click", () => openCell(x, y));

      // PC右クリック
      cell.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        toggleFlag(x, y);
      });

      // ▼▼▼ スマホ用長押し ▼▼▼
      let pressTimer;
      let isLongPress = false;

      cell.addEventListener("touchstart", (e) => {
        isLongPress = false;

        pressTimer = setTimeout(() => {
          isLongPress = true;
          toggleFlag(x, y);
        }, 250); // ←ここで長押し時間調整（今250ms）
      });

      cell.addEventListener("touchend", (e) => {
        clearTimeout(pressTimer);

        if (!isLongPress) {
          openCell(x, y);
        }
      });


      game.appendChild(cell);
    }
  }
}

function toggleFlag(x, y) {
  if (gameOver) return;

  const cellData = board[y][x];
  if (cellData.open) return;

  const index = y * SIZE + x;
  const cell = game.children[index];

  cellData.flag = !cellData.flag;
  cell.classList.toggle("flag");
  cell.textContent = cellData.flag ? "❤" : "";
  flagSound.currentTime = 0;
  flagSound.play();
}

function openCell(x, y) {

  if (gameOver) return;

  const cellData = board[y][x];
  if (cellData.open || cellData.flag) return;

  if (openSound) {
    openSound.currentTime = 0;
    openSound.play();
  }

  const index = y * SIZE + x;
  const cell = game.children[index];

  cellData.open = true;
  cell.classList.add("open");

  if (cellData.mine) {
    cell.textContent = "💀";

    if (missSound) {
      missSound.currentTime = 0;
      missSound.play();
    }
    bgLayer.style.filter = "brightness(0.3)";
    message.textContent = "ゲームオーバー…💀";
    gameOver = true;
    return;
  }


  if (cellData.count > 0) {
    cell.innerHTML = `<span class="number">${cellData.count}</span>`;
  } else {
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        let ny = y + dy;
        let nx = x + dx;
        if (ny >= 0 && ny < SIZE && nx >= 0 && nx < SIZE) {
          openCell(nx, ny);
        }
      }
    }
  }

  checkWin();
}

function useHint() {
  if (gameOver || hintCount <= 0) return;

  let candidates = [];

  // 開けられる安全マスを集める
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      if (!board[y][x].mine && !board[y][x].open) {
        candidates.push({ x, y });
      }
    }
  }

  if (candidates.length === 0) return;

  // ランダム選択
  const randomIndex = Math.floor(Math.random() * candidates.length);
  const chosen = candidates[randomIndex];

  openCell(chosen.x, chosen.y);

  hintCount--;
  message.textContent = `ステージ ${currentStage + 1}　ヒント残り: ${hintCount}`;
}


function checkWin() {
  let safeCount = 0;

  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      if (!board[y][x].mine && board[y][x].open) safeCount++;
    }
  }

  if (safeCount === SIZE * SIZE - MINE_COUNT) {
    stageClear();
  }
}

function stageClear() {
  gameOver = true;

  clearSound.currentTime = 0;
  clearSound.play();

  const effect = document.getElementById("clearEffect");
  effect.classList.add("show");

  // セルを順番に消す演出
  let i = 0;
  const cells = [...game.children];

  const interval = setInterval(() => {
    if (i >= cells.length) {
      clearInterval(interval);
      return;
    }
    cells[i].style.opacity = "0";
    i++;
  }, 20);

  setTimeout(() => {
    effect.classList.remove("show");

    currentStage++;
    if (currentStage < stages.length) {
      init();
    } else {
      finalClear();
    }
  }, 4000);
}


function finalClear() {
  gameOver = true;

  const video = document.getElementById("rewardVideo");

  game.innerHTML = "";
  bgLayer.style.backgroundImage = "none";

  if (finalSound) {
    finalSound.currentTime = 0;
    finalSound.play();
  }

  video.src = rewardVideoFile;
  video.style.display = "block";
  video.currentTime = 0;

  video.muted = true;
  video.play();

  message.textContent = "🎉 Congratulations!! 🎉";
  message.classList.add("clearMessage");

  video.classList.add("show");
}




resetBtn.addEventListener("click", () => {
  currentStage = 0;
  init();
});

init();
