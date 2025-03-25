import mysql from "mysql2/promise";
import { GameGateway } from "../dataaccess/gameGateway";
import { connectMySQL } from "../dataaccess/connection";
import { DARK, INITIAL_BOARD } from "../application/constants";

const gameGateway = new GameGateway();

export class GameService {
  async startNewGame() {
    const now = new Date();

    const conn = await connectMySQL();

    try {
      await conn.beginTransaction();

      const gamerecord = await gameGateway.insert(conn, now);

      const turnInsertResult = await conn.execute<mysql.ResultSetHeader>(
        "insert into turns (game_id, turn_count, next_disc, end_at) values (?, ?, ?, ?)",
        [gamerecord.id, 0, DARK, now]
      );
      const turnId = turnInsertResult[0].insertId;

      const squareCount = INITIAL_BOARD.map((line) => line.length).reduce(
        (v1, v2) => v1 + v2,
        0
      );

      const squaresInsertSql =
        "insert into squares (turn_id, x, y, disc) values " +
        Array.from(Array(squareCount))
          .map(() => "(?, ?, ?, ?)")
          .join(", ");

      const squaresInsertValues: any[] = [];
      INITIAL_BOARD.forEach((line, y) => {
        line.forEach((disc, x) => {
          squaresInsertValues.push(turnId);
          squaresInsertValues.push(x);
          squaresInsertValues.push(y);
          squaresInsertValues.push(disc);
        });
      });

      await conn.execute(squaresInsertSql, squaresInsertValues);

      await conn.commit();
    } finally {
      await conn.end();
    }
  }
}
