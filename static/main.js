const gameTableBodyElement = document.getElementById('game-table-body')

// 勝者の表示を変換する関数
function winnerDiscToString(winnerDisc) {
  if (winnerDisc === 0) return '引き分け'
  return winnerDisc === 1 ? '黒' : '白'
}

// 日時をフォーマットする関数
function formatDate(dateString) {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date)
}

// ゲーム履歴を取得して表示する
async function loadGameHistory() {
  try {
    const response = await fetch('/api/games')
    const responseBody = await response.json()
    
    // テーブルの内容をクリア
    while (gameTableBodyElement.firstChild) {
      gameTableBodyElement.removeChild(gameTableBodyElement.firstChild)
    }
    
    // ゲーム履歴がない場合
    if (responseBody.games.length === 0) {
      const row = document.createElement('tr')
      const cell = document.createElement('td')
      cell.colSpan = 5
      cell.textContent = '対戦履歴がありません'
      cell.style.textAlign = 'center'
      row.appendChild(cell)
      gameTableBodyElement.appendChild(row)
      return
    }
    
    // 各ゲームの履歴を表示
    responseBody.games.forEach(game => {
      const row = document.createElement('tr')
      
      // 黒を打った回数
      const darkMoveCountCell = document.createElement('td')
      darkMoveCountCell.textContent = game.darkMoveCount
      row.appendChild(darkMoveCountCell)
      
      // 白を打った回数
      const lightMoveCountCell = document.createElement('td')
      lightMoveCountCell.textContent = game.lightMoveCount
      row.appendChild(lightMoveCountCell)
      
      // 勝った石
      const winnerDiscCell = document.createElement('td')
      winnerDiscCell.textContent = winnerDiscToString(game.winnerDisc)
      row.appendChild(winnerDiscCell)
      
      // 対戦開始時刻
      const startedAtCell = document.createElement('td')
      startedAtCell.textContent = formatDate(game.startedAt)
      row.appendChild(startedAtCell)
      
      // 対戦終了時刻
      const endAtCell = document.createElement('td')
      endAtCell.textContent = formatDate(game.endAt)
      row.appendChild(endAtCell)
      
      gameTableBodyElement.appendChild(row)
    })
  } catch (error) {
    console.error('ゲーム履歴の取得に失敗しました', error)
    gameTableBodyElement.innerHTML = '<tr><td colspan="5" style="text-align: center;">履歴の取得に失敗しました</td></tr>'
  }
}

// ページ読み込み時に履歴を表示
document.addEventListener('DOMContentLoaded', loadGameHistory)
