import mysql from "mysql2/promise";
import { Game } from "./game";
import { GameGateway } from "../../infrastructure/gameGateway";

const gameGateway = new GameGateway();

export class GameRepository {
  async findLatest(conn: mysql.Connection): Promise<Game | undefined> {
    const gameRecord = await gameGateway.findLatest(conn);

    if (!gameRecord) {
      return undefined;
    }

    return new Game(gameRecord.id, gameRecord.startedAt);
  }

  async save(conn: mysql.Connection, game: Game): Promise<Game> {
    const now = game.startedAt;
    const gameRecord = await gameGateway.insert(conn, now);

    return new Game(gameRecord.id, gameRecord.startedAt);
  }
}
