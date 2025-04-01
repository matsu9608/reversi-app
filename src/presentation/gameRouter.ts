import express from "express";
import { StartNewGameUseCase } from "../application/useCase/startNewGameUseCase";
import { GameMySQLRepository } from "../infrastructure/repository/game/gameMySQLRepsitory";
import { TurnMySQLRepository } from "../infrastructure/repository/turn/turnMySQLRepository";
import { FindLastGameUseCase } from "../application/useCase/findLastGamesUseCase";
import { FindLastGameMySQLQueryService } from "../infrastructure/query/findLastGameMySQLQueryService";
import { WinnerDisc } from "../domain/model/gameResult/winnerDisc";

export const gameRouter = express.Router();

const startNewGameUseCase = new StartNewGameUseCase(
  new GameMySQLRepository(),
  new TurnMySQLRepository()
);

const findLastGamesUseCase = new FindLastGameUseCase(
  new FindLastGameMySQLQueryService()
);

interface GetGamesResponseBody {
  games: {
    id: number;
    darkMoveCount: number;
    lightMoveCount: number;
    winnerDisc: number;
    startedAt: Date;
    endAt: Date;
  }[];
}

gameRouter.get("/api/games",
  async (req, res: express.Response<GetGamesResponseBody>) => {
    const output = await findLastGamesUseCase.run();

    const responseBodyGames = output.map((g) => {
      return {
        id: g.gameId,
        darkMoveCount: g.darkMoveCount,
        lightMoveCount: g.lightMoveCount,
        winnerDisc: g.winnerDisc,
        startedAt: g.startedAt,
        endAt: g.endAt,
      };
    });

    const responseBody = {
      games: responseBodyGames,
    };
    res.json(responseBody);
  }
)

gameRouter.post("/api/games", async (req, res) => {
  await startNewGameUseCase.run();

  res.status(201).end();
});
