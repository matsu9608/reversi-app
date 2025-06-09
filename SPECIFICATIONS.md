# システム仕様書

## 目次

1.  [全体アーキテクチャ](#1-全体アーキテクチャ)
2.  [APIエンドポイント](#2-apiエンドポイント)
    *   [2.1. ゲーム管理](#21-ゲーム管理)
    *   [2.2. ゲームプレイ](#22-ゲームプレイ)
3.  [データモデル (ドメイン層)](#3-データモデル-ドメイン層)
    *   [3.1. `Disc` (石)](#31-disc-石)
    *   [3.2. `Point` (点)](#32-point-点)
    *   [3.3. `Move` (手)](#33-move-手)
    *   [3.4. `Board` (盤面)](#34-board-盤面)
    *   [3.5. `Turn` (ターン)](#35-turn-ターン)
    *   [3.6. `Game` (ゲーム)](#36-game-ゲーム)
    *   [3.7. `WinnerDisc` (勝者)](#37-winnerdisc-勝者)
    *   [3.8. `GameResult` (ゲーム結果)](#38-gameresult-ゲーム結果)
    *   [関係性](#関係性)
4.  [主要なアプリケーションロジック (ユースケース)](#4-主要なアプリケーションロジック-ユースケース)
    *   [4.1. `StartNewGameUseCase` (新規ゲーム開始ユースケース)](#41-startnewgameusecase-新規ゲーム開始ユースケース)
    *   [4.2. `RegisterTurnUseCase` (ターン登録ユースケース)](#42-registerturnusecase-ターン登録ユースケース)
    *   [4.3. `FindLatestGameTurnByTurnCountUseCase` (最新ゲームの指定ターン検索ユースケース)](#43-findlatestgameturnbyturncountusecase-最新ゲームの指定ターン検索ユースケース)
    *   [4.4. `FindValidMovesUseCase` (有効手検索ユースケース)](#44-findvalidmovesusecase-有効手検索ユースケース)
    *   [4.5. `FindLastGamesUseCase` (最新ゲーム履歴検索ユースケース)](#45-findlastgamesusecase-最新ゲーム履歴検索ユースケース)
5.  [データベーススキーマ](#5-データベーススキーマ)
    *   [5.1. `games` テーブル](#51-games-テーブル)
    *   [5.2. `turns` テーブル](#52-turns-テーブル)
    *   [5.3. `moves` テーブル](#53-moves-テーブル)
    *   [5.4. `squares` テーブル](#54-squares-テーブル)
    *   [5.5. `game_results` テーブル](#55-game_results-テーブル)

## 1. 全体アーキテクチャ

本システムは、関心の分離と保守性を促進するレイヤードアーキテクチャパターンを採用しています。主要なレイヤーは以下の通りです。

1.  **プレゼンテーション層**:
    *   `src/presentation/` に配置されています。
    *   クライアントからのHTTPリクエストの受信とレスポンスの送信を担当します。
    *   APIエンドポイントを定義し（詳細は `docs/openapi.yml` を参照）、ルーター（`gameRouter.ts`, `turnRouter.ts`）を使用してリクエストを適切なアプリケーションサービスにマッピングします。
    *   このレイヤーはアプリケーション層と対話します。

2.  **アプリケーション層**:
    *   `src/application/` に配置されています。
    *   アプリケーション固有のロジックを含み、ドメイン層とインフラストラクチャ層を調整してタスクを編成します。
    *   新しいゲームの開始（`startNewGameUseCase.ts`）、プレイヤーのターンの登録（`registerTurnUseCase.ts`）、ゲーム情報の検索などのユースケースを実装します。
    *   このレイヤーはトランザクション管理とアプリケーションレベルのエラーハンドリングを担当します。

3.  **ドメイン層**:
    *   `src/domain/` に配置されています。
    *   これはアプリケーションの中核であり、ゲームに関連するビジネスロジック、エンティティ、および値オブジェクト（例: `Game`, `Turn`, `Board`, `Disc`, `Point`）を含んでいます。
    *   他のレイヤーから独立して設計されており、特定のデータベースやUIの詳細については関知しません。
    *   ドメインエラーは `src/domain/error/` で定義されます。

4.  **インフラストラクチャ層**:
    *   `src/infrastructure/` に配置されています。
    *   特に外部の関心事について、アプリケーション層またはドメイン層で定義されたインターフェースの実装を提供します。
    *   これには、データベースアクセス（`GameRepositoryMySQL.ts`、`TurnRepositoryMySQL.ts` などのリポジトリ）、外部サービス連携、その他の技術的な機能が含まれます。
    *   `connection.ts` は、データベース接続（`docker-compose.yml` と `mysql/` ディレクトリが示すようにMySQL）を管理していると考えられます。

アプリケーションは、`docker-compose.yml` で定義されているようにDockerコンテナで実行されるように設計されており、通常、Node.jsアプリケーション用のコンテナとMySQLデータベース用の別のコンテナが含まれます。`bin/` ディレクトリ内のシェルスクリプトは、データベース設定などの開発および運用タスクを支援します。

## 2. APIエンドポイント

このAPIは、リバーシゲームの管理とプレイのためのエンドポイントを提供します。

### 2.1. ゲーム管理

#### `GET /api/games`
*   **概要:** 対戦履歴を取得します。
*   **タグ:** 対戦履歴を表示
*   **レスポンス:**
    *   `200 OK`: ゲームのリストを返します。
        *   **コンテンツ:** `application/json`
        *   **スキーマ:**
            ```json
            {
              "games": [
                {
                  "id": 1,
                  "darkMoveCount": 1,
                  "lightMoveCount": 1,
                  "winnerDisc": 1,
                  "startedAt": "2017-07-21T17:32:28Z",
                  "endAt": "2017-07-21T17:32:28Z"
                }
              ]
            }
            ```

#### `POST /api/games`
*   **概要:** 対戦開始時の初期データを登録します。
*   **タグ:** 対戦する
*   **レスポンス:**
    *   `201 Created`: ゲームが正常に作成されたことを示します。

### 2.2. ゲームプレイ

#### `GET /api/games/latest/turns/{turnCount}`
*   **概要:** 現在（指定された）の盤面状態を表示します。
*   **タグ:** 対戦する
*   **パラメータ:**
    *   `turnCount` (パスパラメータ, integer, 必須): 盤面状態を取得するターン数。
*   **レスポンス:**
    *   `200 OK`: 指定されたターンの盤面状態を返します。
        *   **コンテンツ:** `application/json`
        *   **スキーマ:**
            ```json
            {
              "turnCount": 1,
              "board": [
                [0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 1, 2, 0, 0, 0],
                [0, 0, 0, 2, 1, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0]
              ],
              "nextDisc": 1,
              "winnerDisc": 0 // 0: 勝者未定, 1: 黒の勝ち, 2: 白の勝ち (または null)
            }
            ```
            *(注: openapi.yml の `winnerDisc` の例は1でしたが、特定のターン表示でゲームが進行中の場合は、勝者がまだ決まっていないため0またはnullが適切です)*

#### `POST /api/games/latest/turns`
*   **概要:** プレイヤーが盤面に置いた石を登録します。
*   **タグ:** 対戦する
*   **リクエストボディ:**
    *   **コンテンツ:** `application/json`
    *   **スキーマ:**
        ```json
        {
          "turnCount": 1,
          "move": {
            "disc": 1, // 1は黒、2は白
            "x": 1,    // 0始まりの列インデックス
            "y": 2     // 0始まりの行インデックス
          }
        }
        ```
*   **レスポンス:**
    *   `201 Created`: ターンが正常に登録されたことを示します。

#### `GET /api/games/latest/turns/{turnCount}/valid-moves`
*   **概要:** 指定されたターンで有効な手の一覧を取得します。
*   **タグ:** 対戦する
*   **パラメータ:**
    *   `turnCount` (パスパラメータ, integer, 必須): 現在のターン数。
*   **レスポンス:**
    *   `200 OK`: 有効な手のリストを返します。
        *   **コンテンツ:** `application/json`
        *   **スキーマ:**
            ```json
            {
              "validMoves": [
                {
                  "disc": 1, // 手番の石の色
                  "x": 2,    // 0始まりの列インデックス
                  "y": 3     // 0始まりの行インデックス
                }
              ]
            }
            ```
## 3. データモデル (ドメイン層)

コアとなるドメインロジックは、`src/domain/model/` にある以下のモデルを中心に構築されています。

### 3.1. `Disc` (石)
*   **ファイル:** `src/domain/model/turn/disc.ts`
*   **説明:** 盤上の位置の状態またはプレイヤーの色を表します。
*   **型:** Enum風オブジェクト。
*   **値:**
    *   `Empty`: 0 (盤上の空のマス)
    *   `Dark`: 1 (黒プレイヤー)
    *   `Light`: 2 (白プレイヤー)
    *   `Wall`: 3 (盤面の境界を示すために `Board` モデル内部で使用される壁)
*   **ヘルパー関数:** `toDisc(value: any): Disc` は値を `Disc` 型に変換し、無効な場合はエラーをスローします。
*   **ヘルパー関数:** `isOppositeDisc(disc1: Disc, disc2: Disc): boolean` は2つの石が反対のプレイヤーの色であるかを確認します。

### 3.2. `Point` (点)
*   **ファイル:** `src/domain/model/turn/point.ts`
*   **説明:** ゲーム盤上の座標 (x, y) を表します。
*   **属性:**
    *   `_x: number`: x座標 (0-7)。
    *   `_y: number`: y座標 (0-7)。
*   **検証:** コンストラクタは座標が有効範囲 (0-7) 外の場合に `DomainError` をスローします。

### 3.3. `Move` (手)
*   **ファイル:** `src/domain/model/turn/move.ts`
*   **説明:** 特定の点に石を置くプレイヤーのアクションを表します。
*   **属性:**
    *   `_disc: Disc`: 置かれる石の色。
    *   `_point: Point`: 石が置かれる盤上の点。

### 3.4. `Board` (盤面)
*   **ファイル:** `src/domain/model/turn/board.ts`
*   **説明:** リバーシのゲーム盤とその上の石の状態を表します。
*   **属性:**
    *   `_discs: Disc[][]`: ゲーム盤を表す2次元配列 (8x8)。各要素は `Disc` です。
*   **主要メソッド:**
    *   `constructor(discs: Disc[][])`: 盤面を初期化します。
    *   `place(move: Move): Board`: ゲームルールに従って盤上に石を置きます（相手の石を裏返します）。更新された状態で新しい `Board` インスタンスを返します。手が無効な場合（例：点が空でない、裏返せる石がない）、`DomainError` をスローします。
    *   `listFlipPoints(move: Move): Point[]`: (プライベート) 指定された手によってどの相手の石が裏返されるかを計算します。
    *   `existValidMove(disc: Disc): boolean`: 指定されたプレイヤー (`disc`) が現在の盤面で有効な手を持っているかを確認します。
    *   `listValidMoves(disc: Disc): { x: number, y: number }[]`: 指定されたプレイヤー (`disc`) が石を置くことができる有効な (x,y) 座標のリストを返します。
    *   `count(disc: Disc): number`: 盤上の指定された石の数を数えます。
*   **初期状態:** `initialBoard` はリバーシゲームの開始設定を表すエクスポートされた定数です。

### 3.5. `Turn` (ターン)
*   **ファイル:** `src/domain/model/turn/turn.ts`
*   **説明:** ゲーム内の単一のターンを表し、そのターンの手による盤面の状態を含みます。
*   **属性:**
    *   `_gameId: number`: このターンが属するゲームのID。
    *   `_turnCount: number`: ゲーム内のこのターンのシーケンシャル番号（初期状態は0から始まる）。
    *   `_nextDisc: Disc | undefined`: 次に手番となるプレイヤーの石の色。ゲームが終了した場合、またはどちらのプレイヤーも有効な手がない場合は `undefined`。
    *   `_move: Move | undefined`: このターンで行われた手。初期ターン（ターン0）では `undefined`。
    *   `_board: Board`: このターンの手による盤面の状態。
    *   `_endAt: Date`: ターンが記録されたタイムスタンプ。
*   **主要メソッド:**
    *   `constructor(...)`: ターンを初期化します。
    *   `placeNext(disc: Disc, point: Point): Turn`: 指定された `point` に指定された `disc` を置いて次のターンを作成します。手を検証し、盤面を更新し、次のプレイヤーを決定し、ターンカウントをインクリメントします。`disc` が期待される `_nextDisc` でない場合、`DomainError` をスローします。
    *   `gameEnded(): boolean`: 次のプレイヤーがいない場合（つまり `_nextDisc` が `undefined`）、`true` を返します。
    *   `winnerDisc(): WinnerDisc`: 現在の盤面状態（石の数）に基づいて勝者を計算します。
*   **ファクトリ関数:** `firstTurn(gameId: number, endAt: Date): Turn`: 新しいゲームの初期ターン（ターン0）を作成します。

### 3.6. `Game` (ゲーム)
*   **ファイル:** `src/domain/model/game/game.ts`
*   **説明:** 単一のゲームセッションを表します。
*   **属性:**
    *   `_id: number | undefined`: ゲームの一意の識別子。ゲームがまだ永続化されていない場合は `undefined` の可能性があります。
    *   `_startedAt: Date`: ゲームが開始されたタイムスタンプ。

### 3.7. `WinnerDisc` (勝者)
*   **ファイル:** `src/domain/model/gameResult/winnerDisc.ts`
*   **説明:** 誰が勝ったかという観点からゲームの結果を表します。
*   **型:** Enum風オブジェクト。
*   **値:**
    *   `Draw`: 0 (引き分け)
    *   `Dark`: 1 (黒の勝ち)
    *   `Light`: 2 (白の勝ち)
*   **ヘルパー関数:** `toWinnerDisc(value: any): WinnerDisc` は値を `WinnerDisc` 型に変換し、無効な場合は `DomainError` をスローします。

### 3.8. `GameResult` (ゲーム結果)
*   **ファイル:** `src/domain/model/gameResult/gameResult.ts`
*   **説明:** 完了したゲームの結果を表します。
*   **属性:**
    *   `_gameId: number`: この結果が関連するゲームのID。
    *   `_winnerDisc: WinnerDisc`: ゲームの勝者。
    *   `_endAt: Date`: ゲームが終了したタイムスタンプ。

### 関係性:
*   `Game` は複数の `Turn` を通じてプレイされます。
*   各 `Turn` は `Board` の状態と、その状態に至ったオプションの `Move` を持ちます。
*   `Move` は `Disc` と `Point` で構成されます。
*   `Game` が終了すると、`GameResult` があり、これには `WinnerDisc` が含まれます。

## 4. 主要なアプリケーションロジック (ユースケース)

`src/application/useCase/` ディレクトリには、ドメインモデルとリポジトリの相互作用を調整するコアアプリケーションロジックが含まれています。

### 4.1. `StartNewGameUseCase` (新規ゲーム開始ユースケース)
*   **ファイル:** `src/application/useCase/startNewGameUseCase.ts`
*   **目的:** 新しいゲームを初期化します。
*   **主要ステップ:**
    1.  データベース接続を確立します。
    2.  データベーストランザクションを開始します。
    3.  現在のタイムスタンプで新しい `Game` エンティティを作成します。
    4.  `GameRepository` を使用して新しい `Game` を保存し、ゲームIDを取得します。
    5.  新しいゲームIDに対して `firstTurn` (ターン0) を作成します。
    6.  `TurnRepository` を使用して初期 `Turn` を保存します。
    7.  トランザクションをコミットします。
    8.  データベース接続を閉じます。

### 4.2. `RegisterTurnUseCase` (ターン登録ユースケース)
*   **ファイル:** `src/application/useCase/registerTurnUseCase.ts`
*   **目的:** 現在のゲームにおけるプレイヤーの手を記録します。
*   **入力:** `turnCount` (number), `disc` (Disc), `point` (Point)。
*   **主要ステップ:**
    1.  データベース接続を確立します。
    2.  データベーストランザクションを開始します。
    3.  `GameRepository` を使用して最新の `Game` を取得します。
    4.  `TurnRepository` を使用して現在のゲームの前の `Turn` (入力 `turnCount - 1`) を取得します。
    5.  前の `Turn` ドメインエンティティの `placeNext()` メソッドを呼び出し、現在の手の `disc` と `point` を提供します。これにより、更新された盤面状態と次のプレイヤーを持つ `newTurn` オブジェクトが返されます。
    6.  `TurnRepository` を使用して `newTurn` を保存します。
    7.  `newTurn.gameEnded()` が true の場合:
        *   `newTurn.winnerDisc()` から `winnerDisc` を決定します。
        *   `GameResult` エンティティを作成します。
        *   `GameResultRepository` を使用して `GameResult` を保存します。
    8.  トランザクションをコミットします。
    9.  データベース接続を閉じます。

### 4.3. `FindLatestGameTurnByTurnCountUseCase` (最新ゲームの指定ターン検索ユースケース)
*   **ファイル:** `src/application/useCase/findLatestGameTurnByTurnCountUseCase.ts`
*   **目的:** 最新ゲームの特定のターンカウントにおける状態を取得します。
*   **入力:** `turnCount` (number)。
*   **出力:** `FindLatestGameTurnByTurnCountOutput` (`turnCount`, `board`, `nextDisc`, `winnerDisc` を含む)。
*   **主要ステップ:**
    1.  データベース接続を確立します。
    2.  `GameRepository` を使用して最新の `Game` を取得します。
    3.  ゲームが見つからない場合、`ApplicationError` をスローします。
    4.  `TurnRepository` を使用して、ゲームIDと `turnCount` に指定された `Turn` を取得します。
    5.  `turn.gameEnded()` が true の場合、`GameResultRepository` を使用してゲームIDの `GameResult` を取得します。
    6.  ターンデータ、盤面状態、次の石、勝者（該当する場合）を含む `FindLatestGameTurnByTurnCountOutput` オブジェクトを構築して返します。
    7.  データベース接続を閉じます。

### 4.4. `FindValidMovesUseCase` (有効手検索ユースケース)
*   **ファイル:** `src/application/useCase/findValidMovesUseCase.ts`
*   **目的:** 最新ゲームの特定のターンにおける現在のプレイヤーの全ての有効な手を検索します。
*   **入力:** `turnCount` (number)。
*   **出力:** それぞれが有効な手を表す `disc`, `x`, `y` プロパティを持つオブジェクトの配列。
*   **主要ステップ:**
    1.  *(注: このユースケースは、最新のゲームを明示的に特定せず、`turnCount` のみでターン情報を取得しているように見受けられます。これは `FindLatestGameTurnByTurnCountUseCase` とは異なる、簡略化されたコンテキストや目的を持つ可能性があります。)*
    2.  `TurnRepository` を使用して指定された `turnCount` の `Turn` を取得します。
    3.  ターンが見つからない場合、`ApplicationError` をスローします。
    4.  `turn.nextDisc` が未定義の場合（ゲームが終了したか、どちらのプレイヤーも動けない）、空の配列を返します。
    5.  `turn.board.listValidMoves(turn.nextDisc)` を呼び出して、有効な手の座標のリストを取得します。
    6.  これらの座標を、現在のプレイヤーの `disc` を含む出力形式にマッピングします。

### 4.5. `FindLastGamesUseCase` (最新ゲーム履歴検索ユースケース)
*   **ファイル:** `src/application/useCase/findLastGamesUseCase.ts`
*   **目的:** 最近プレイされたゲームのリストを取得します。
*   **出力:** `FindLastGamesQueryModel` オブジェクトの配列。
*   **主要ステップ:**
    1.  データベース接続を確立します。
    2.  `FindLastGameQueryService` を使用して、最新 `FIND_COUNT` (現在10) 件のゲームを照会します。
    3.  データベース接続を閉じます。
    4.  ゲームのリストを返します。

## 5. データベーススキーマ

データベーススキーマは `mysql/init.sql` で定義されています。アプリケーションは `reversi` という名前のMySQLデータベースを使用します。

### 5.1. `games` テーブル
*   **説明:** 各ゲームセッションに関する情報を格納します。
*   **カラム:**
    *   `id INT PRIMARY KEY AUTO_INCREMENT`: ゲームの一意の識別子。
    *   `started_at DATETIME NOT NULL`: ゲームが開始されたタイムスタンプ。

### 5.2. `turns` テーブル
*   **説明:** ゲーム内の各ターンに関する情報を格納します。
*   **カラム:**
    *   `id INT PRIMARY KEY AUTO_INCREMENT`: ターンの一意の識別子。
    *   `game_id INT NOT NULL`: `games.id` を参照する外部キー。このターンが属するゲームを示します。
    *   `turn_count INT NOT NULL`: ゲーム内のこのターンのシーケンシャル番号。
    *   `next_disc INT`: 次のプレイヤーの石の色。`Disc` enum（`0`: 空, `1`: 黒, `2`: 白）に対応します。ゲームが終了した場合、またはどちらのプレイヤーも有効な手がない場合は `NULL` となることがあります。
    *   `end_at DATETIME NOT NULL`: ターンが完了/記録されたタイムスタンプ。
*   **制約:**
    *   `FOREIGN KEY (game_id) REFERENCES games (id)`
    *   `UNIQUE (game_id, turn_count)`: ゲーム内で各ターンカウントが一意であることを保証します。

### 5.3. `moves` テーブル
*   **説明:** ターンで行われた具体的な手を記録します。
*   **カラム:**
    *   `id INT PRIMARY KEY AUTO_INCREMENT`: 手の一意の識別子。
    *   `turn_id INT NOT NULL`: `turns.id` を参照する外部キー。この手が属するターンを示します。
    *   `disc INT NOT NULL`: 置かれた石の色。
    *   `x INT NOT NULL`: 手のx座標。
    *   `y INT NOT NULL`: 手のy座標。
*   **制約:**
    *   `FOREIGN KEY (turn_id) REFERENCES turns (id)`

### 5.4. `squares` テーブル
*   **説明:** 各ターンの盤面の各マスの状態を格納します。これにより、各ターンの盤面のスナップショットが提供されます。
*   **カラム:**
    *   `id INT PRIMARY KEY AUTO_INCREMENT`: マス状態エントリの一意の識別子。
    *   `turn_id INT NOT NULL`: `turns.id` を参照する外部キー。
    *   `x INT NOT NULL`: マスのx座標。
    *   `y INT NOT NULL`: マスのy座標。
    *   `disc INT NOT NULL`: 指定された `turn_id` のこのマス(x,y)に存在する石の色。
*   **制約:**
    *   `FOREIGN KEY (turn_id) REFERENCES turns (id)`
    *   `UNIQUE (turn_id, x, y)`: 盤上の各マスがターンごとに1回だけ記録されることを保証します。

### 5.5. `game_results` テーブル
*   **説明:** 完了したゲームの結果を格納します。
*   **カラム:**
    *   `id INT PRIMARY KEY AUTO_INCREMENT`: ゲーム結果の一意の識別子。
    *   `game_id INT NOT NULL`: `games.id` を参照する外部キー。
    *   `winner_disc INT NOT NULL`: ゲームの勝者。`WinnerDisc` enum（0: 引き分け, 1: 黒, 2: 白）に対応します。
    *   `end_at DATETIME NOT NULL`: ゲームが終了したタイムスタンプ。
*   **制約:**
    *   `FOREIGN KEY (game_id) REFERENCES games (id)`
