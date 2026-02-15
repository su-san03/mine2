const openSound = document.getElementById("openSound");
const flagSound = document.getElementById("flagSound");
const clearSound = document.getElementById("clearSound");


const SIZE = 9;
const MINE_COUNT = 10;

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
let hintCount = 6;

function init() {
  bgLayer.style.filter = "brightness(1)";

  game.innerHTML = "";
  board = [];
  gameOver = false;
  hintCount = 6;

  message.textContent = `ステージ ${currentStage + 1}　ヒント残り: 6`;
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
    message.textContent = "ゲームオーバー…";
    gameOver = true;
    return;
  }

  if (cellData.count > 0) {
    cell.textContent = cellData.count;
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

  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      if (!board[y][x].mine && !board[y][x].open) {
        openCell(x, y);
        hintCount--;
        message.textContent = `ステージ ${currentStage + 1}　ヒント残り: ${hintCount}`;
        return;
      }
    }
  }
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
  }, 2000);
}


function finalClear() {
  gameOver = true;

  const effect = document.getElementById("finalEffect");
  const wrapper = document.getElementById("wrapper");

  // フラッシュ
  wrapper.classList.add("flash");

  // COMPLETE表示
  effect.classList.add("show");

  setTimeout(() => {
    effect.classList.remove("show");

    // ご褒美画像表示
    bgLayer.style.backgroundImage = `url(${rewardImage})`;
    game.innerHTML = "";
    message.textContent = "完全クリア！！🎉";
  }, 2000);
}


resetBtn.addEventListener("click", () => {
  currentStage = 0;
  init();
});

init();
