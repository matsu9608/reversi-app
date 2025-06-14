import mysql from "mysql2/promise";
import { GameResult } from "../../../domain/model/gameResult/gameResult";

export interface GameResultRepository {
  findForGameId(
    conn: mysql.Connection,
    gameId: number
  ): Promise<GameResult | undefined>;

  save(conn: mysql.Connection, gameResult: GameResult): Promise<void>;

  deleteForGameId(conn: mysql.Connection, gameId: number): Promise<void>;
}