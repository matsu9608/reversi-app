# API 設計メモ


# 対戦を開始する
「対戦」を登録する

POST /api/games

# 現在の盤面を表示する
GET /api/games/latest/boards/latest

指定したターン数の「ターン」を取得する

GET /api/games/latest/turns/{turnCount}

レスポンスボディ

```json
    "turnCount": 1,
    "board":[
        [0,0,0,0,0,0,0,0]
        [0,0,0,0,0,0,0,0]
        [0,0,0,0,0,0,0,0]
        [0,0,0,0,0,0,0,0]
        [0,0,0,0,0,0,0,0]
        [0,0,0,0,0,0,0,0]
        [0,0,0,0,0,0,0,0]
        [0,0,0,0,0,0,0,0]
    ],
    "nextDisc": 1,
    "winnerDisc": 1,

```

# 石を打つ
「ターン」を登録する
POST /api/games/latest/turns

リクエストボディ
```json
{
    "turnCount":1,
    "move":{
        "disc": 1,
        "x":1,
        "y":2,
    }
}
```
# 勝敗を確認する
# 「自分の過去の対戦結果を確認する」
