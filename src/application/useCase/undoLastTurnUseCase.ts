import { connectMySQL } from "../../infrastructure/connection";
import { ApplicationError } from "../error/applicationError";
import { TurnRepository } from "../../domain/model/turn/turnRepository";
import { GameRepository } from "../../domain/model/game/gameRepository";
import { GameResultRepository } from "../../domain/model/gameResult/gameResultRepository";

export class UndoLastTurnUseCase {
  constructor(
    private turnRepository: TurnRepository,
    private gameRepository: GameRepository,
    private gameResultRepository: GameResultRepository
  ) {}

  async run(): Promise<void> {
    const conn = await connectMySQL();
    try {
      await conn.beginTransaction();

      const game = await this.gameRepository.findLatest(conn);
      if (!game) {
        throw new ApplicationError("LatestGameNotFound", "Latest game not found");
      }
      if (!game.id) {
        throw new Error("game.id is not exist");
      }

      const lastTurn = await this.turnRepository.findLatestForGame(conn, game.id);
      if (!lastTurn || lastTurn.turnCount === 0) {
        throw new ApplicationError("TurnNotFound", "Turn not found");
      }

      await this.turnRepository.delete(conn, game.id, lastTurn.turnCount);
      await this.gameResultRepository.deleteForGameId(conn, game.id);

      await conn.commit();
    } finally {
      await conn.end();
    }
  }
}
