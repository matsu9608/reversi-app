import express from "express";
import { RegisterTurnUseCase } from "../application/useCase/registerTurnUseCase";
import { FindLatestGameTurnByTurnCountUseCase } from "../application/useCase/findLatestGameTurnByTurnCountUseCase";
import { FindValidMovesUseCase } from "../application/useCase/findValidMovesUseCase";
import { Point } from "../domain/model/turn/point";
import { toDisc } from "../domain/model/turn/disc";
import { GameMySQLRepository } from "../infrastructure/repository/game/gameMySQLRepsitory";
import { TurnMySQLRepository } from "../infrastructure/repository/turn/turnMySQLRepository";
import { GameResultMySQLRepository } from "../infrastructure/repository/gameResult/gameResultMySQLRepository";
import { UndoLastTurnUseCase } from "../application/useCase/undoLastTurnUseCase";

export const turnRouter = express.Router();

const findLatestGameTurnByTurnCountUseCase = new FindLatestGameTurnByTurnCountUseCase(
  new TurnMySQLRepository(),
  new GameMySQLRepository(),
  new GameResultMySQLRepository()
);

const findValidMovesUseCase = new FindValidMovesUseCase(
  new TurnMySQLRepository()
);

const registerTurnUseCase = new RegisterTurnUseCase(
  new TurnMySQLRepository(),
  new GameMySQLRepository(),
  new GameResultMySQLRepository()
);

const undoLastTurnUseCase = new UndoLastTurnUseCase(
  new TurnMySQLRepository(),
  new GameMySQLRepository(),
  new GameResultMySQLRepository()
);

interface TurnGetResponseBody {
  turnCount: number;
  board: number[][];
  nextDisc: number | null;
  winnerDisc: number | null;
}

turnRouter.get(
  "/api/games/latest/turns/:turnCount",
  async (req, res: express.Response<TurnGetResponseBody>) => {
    const turnCount = parseInt(req.params.turnCount);

    const output = await findLatestGameTurnByTurnCountUseCase.run(turnCount);

    const responseBody = {
      turnCount: output.turnCount,
      board: output.board,
      nextDisc: output.nextDisc ?? null,
      winnerDisc: output.winnerDisc ?? null,
    };

    res.json(responseBody);
  }
);

interface TurnPostRequestBody {
  turnCount: number;
  move: {
    disc: number;
    x: number;
    y: number;
  };
}

turnRouter.post(
  "/api/games/latest/turns",
  async (req: express.Request<{}, {}, TurnPostRequestBody>, res) => {
    const turnCount = req.body.turnCount;
    const disc = toDisc(req.body.move.disc);
    const point = new Point(req.body.move.x, req.body.move.y);

    await registerTurnUseCase.run(turnCount, disc, point);

    res.status(201).end();
  }
);

interface ValidMovesResponseBody {
  validMoves: {
    disc: number;
    x: number;
    y: number;
  }[];
}

turnRouter.get(
  "/api/games/latest/turns/:turnCount/valid-moves",
  async (req, res: express.Response<ValidMovesResponseBody>) => {
    const turnCount = parseInt(req.params.turnCount);

    const validMoves = await findValidMovesUseCase.run(turnCount);

    const responseBody = {
      validMoves: validMoves
    };

    res.json(responseBody);
  }
);

turnRouter.delete("/api/games/latest/turns/latest", async (_req, res) => {
  await undoLastTurnUseCase.run();
  res.status(200).end();
});
