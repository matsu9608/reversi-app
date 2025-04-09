import mysql from "mysql2/promise";
import { MoveGateway } from "../../../infrastructure/repository/turn/moveGateway";
import { SquareGateway } from "../../../infrastructure/repository/turn/squareGateway";
import { TurnGateway } from "../../../infrastructure/repository/turn/turnGateway";
import { Board } from "./../../../domain/model/turn/board";
import { toDisc } from "./../../../domain/model/turn/disc";
import { Move } from "./../../../domain/model/turn/move";
import { Point } from "./../../../domain/model/turn/point";
import { Turn } from "./../../../domain/model/turn/turn";
import { DomainError } from "./../../../domain/error/domainError";
import { TurnRepository } from "../../../domain/model/turn/turnRepository";

const turnGateway = new TurnGateway();
const moveGateway = new MoveGateway();
const squareGateway = new SquareGateway();

export class TurnMySQLRepository implements TurnRepository {
  async findForGameIdAndTurnCount(
    conn: mysql.Connection,
    gameId: number,
    turnCount: number
  ): Promise<Turn> {
    const turnRecord = await turnGateway.findForGameIdAndTurnCount(
      conn,
      gameId,
      turnCount
    );
    if (!turnRecord) {
      throw new DomainError(
        "SpecifiedTuenNotFound",
        "Specified turn not found"
      );
    }

    const squareRecords = await squareGateway.findForTurnId(
      conn,
      turnRecord.id
    );
    const board = Array.from(Array(8)).map(() => Array.from(Array(8)));
    squareRecords.forEach((s) => {
      board[s.y][s.x] = s.disc;
    });

    const moveRecord = await moveGateway.findForTurnId(conn, turnRecord.id);
    let move: Move | undefined;
    if (moveRecord) {
      move = new Move(
        toDisc(moveRecord.disc),
        new Point(moveRecord.x, moveRecord.y)
      );
    }

    const nextDisc =
      turnRecord.nextDisc === null ? undefined : toDisc(turnRecord.nextDisc);

    return new Turn(
      gameId,
      turnCount,
      nextDisc,
      move,
      new Board(board),
      turnRecord.endAt
    );
  }

  async findByTurnCount(turnCount: number): Promise<Turn | undefined> {
    // Get connection and find the latest game
    const conn = await mysql.createConnection({
      host: "mysql",
      database: "reversi",
      user: "root",
      password: ""
    });

    try {
      // Get the latest game ID
      const [games] = await conn.execute<mysql.RowDataPacket[]>(
        "select id from games order by id desc limit 1"
      );

      if (games.length === 0) {
        return undefined;
      }

      const gameId = games[0].id;

      // Find the turn for this game
      return await this.findForGameIdAndTurnCount(conn, gameId, turnCount);
    } catch (e) {
      // If the turn is not found, return undefined instead of throwing an error
      if (e instanceof DomainError && e.type === "SpecifiedTuenNotFound") {
        return undefined;
      }
      throw e;
    } finally {
      await conn.end();
    }
  }

  async save(conn: mysql.Connection, turn: Turn) {
    const turnRecord = await turnGateway.insert(
      conn,
      turn.gameId,
      turn.turnCount,
      turn.nextDisc,
      turn.endAt
    );

    await squareGateway.insertAll(conn, turnRecord.id, turn.board.discs);

    if (turn.move) {
      await moveGateway.insert(
        conn,
        turnRecord.id,
        turn.move.disc,
        turn.move.point.x,
        turn.move.point.y
      );
    }
  }
}
