const EMPTY = 0;
const DARK = 1;
const LIGHT = 2;

const WINNER_DRAW = 0
const WINNER_DARK = 1
const WINNER_LIGHT = 2

const boardElement = document.getElementById("board");
const nextDiscMessageElement = document.getElementById("next-disc-message");
const warningMessageElement = document.getElementById("warning-message");
const darkCountElement = document.getElementById("dark-count");
const lightCountElement = document.getElementById("light-count");
const newGameButtonElement = document.getElementById("new-game-button");

// Add event listener for new game button
newGameButtonElement.addEventListener("click", async () => {
  await registerGame();
  await showBoard(0);
});

// Variable to track game state
let gameInProgress = true;

async function showBoard(turnCount, previousDisc) {
  const response = await fetch(`/api/games/latest/turns/${turnCount}`);
  const responseBody = await response.json();
  const board = responseBody.board;
  const nextDisc = responseBody.nextDisc;
  const winnerDisc = responseBody.winnerDisc;

  // Update game state
  gameInProgress = nextDisc !== null;

  // Update disc counts
  updateDiscCounts(board);

  showWarningMessage(previousDisc, nextDisc, winnerDisc);
  showNextDiscMessage(nextDisc);

  while (boardElement.firstChild) {
    boardElement.removeChild(boardElement.firstChild);
  }

  board.forEach((line, y) => {
    line.forEach((square, x) => {
      // <div class="square">
      const squareElement = document.createElement("div");
      squareElement.className = "square";

      if (square !== EMPTY) {
        // <div class="stone dark">
        const stoneElement = document.createElement("div");
        const color = square === DARK ? "dark" : "light";
        stoneElement.className = `stone ${color}`;

        squareElement.appendChild(stoneElement);
      } else {
        squareElement.addEventListener("click", async () => {
          // Prevent clicks if game is over or not player's turn
          if (!gameInProgress) {
            showTemporaryMessage("ゲームは終了しました。新しいゲームを開始してください。");
            return;
          }

          const nextTurnCount = turnCount + 1;
          const registerTurnResponse = await registerTurn(
            nextTurnCount,
            nextDisc,
            x,
            y
          );

          if (registerTurnResponse.ok) {
            await showBoard(nextTurnCount, nextDisc);
          } else {
            // Show error message if move is invalid
            const errorData = await registerTurnResponse.json().catch(() => ({}));
            showTemporaryMessage(errorData.message || "無効な手です");
          }
        });
      }

      boardElement.appendChild(squareElement);
    });
  });

  // Add visual indicator for valid moves if game is in progress
  if (gameInProgress && nextDisc) {
    showValidMoves(turnCount, nextDisc);
  }
}

// Function to fetch and highlight valid moves
async function showValidMoves(turnCount, disc) {
  try {
    const response = await fetch(`/api/games/latest/turns/${turnCount}/valid-moves`);
    if (!response.ok) return;
    
    const data = await response.json();
    const validMoves = data.validMoves;
    
    validMoves.forEach(move => {
      // Find the square element
      const index = move.y * 8 + move.x;
      const squareElement = boardElement.children[index];
      
      if (squareElement && !squareElement.querySelector('.stone')) {
        // Create a hint element
        const hintElement = document.createElement('div');
        hintElement.className = `move-hint ${disc === DARK ? 'dark-hint' : 'light-hint'}`;
        squareElement.appendChild(hintElement);
      }
    });
  } catch (error) {
    console.error('有効な手の取得に失敗しました', error);
  }
}

// Function to highlight valid moves
function highlightValidMoves(board, disc) {
  // 古い実装は不要なので削除
}

// Display temporary message
function showTemporaryMessage(message) {
  warningMessageElement.innerText = message;
  warningMessageElement.style.display = 'block';
  
  setTimeout(() => {
    warningMessageElement.style.display = 'none';
  }, 3000);
}

// Count discs on the board
function updateDiscCounts(board) {
  let darkCount = 0;
  let lightCount = 0;
  
  board.forEach(line => {
    line.forEach(square => {
      if (square === DARK) darkCount++;
      if (square === LIGHT) lightCount++;
    });
  });
  
  darkCountElement.innerText = darkCount;
  lightCountElement.innerText = lightCount;
}

function discToString(disc){
  return disc === DARK ? '黒' : '白';
}

function showWarningMessage(previousDisc, nextDisc, winnerDisc){
  const message = warningMessage(previousDisc, nextDisc, winnerDisc);

  if(message === null){
    warningMessageElement.style.display = 'none';
  } else {
    warningMessageElement.innerText = message;
    warningMessageElement.style.display = 'block';
  }
}

function warningMessage(previousDisc, nextDisc, winnerDisc){
  if(nextDisc !== null){
    if(previousDisc === nextDisc){
      const skipped = nextDisc === DARK ? LIGHT : DARK;
      return `${discToString(skipped)}の番はスキップです`;
    } else {
      return null;
    }
  } else {
    if (winnerDisc === WINNER_DRAW){
      return '引き分けです';
    } else {
      return `${discToString(winnerDisc)}の勝ちです`;
    }
  }
}

function showNextDiscMessage(nextDisc){
  if (nextDisc){
    nextDiscMessageElement.innerText = `次は${discToString(nextDisc)}の番です`;
  } else {
    nextDiscMessageElement.innerText = 'ゲーム終了';
  }
}

async function registerGame() {
  await fetch("/api/games", {
    method: "POST",
  });
}

async function registerTurn(turnCount, disc, x, y) {
  const requestBody = {
    turnCount,
    move: {
      disc,
      x,
      y,
    },
  };

  return await fetch("/api/games/latest/turns", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });
}

async function main() {
  await registerGame();
  await showBoard(0);
}

main();
