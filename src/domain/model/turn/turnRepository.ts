import mysql from "mysql2/promise";
import { Turn } from "./turn";

export interface TurnRepository {
  findForGameIdAndTurnCount(
    conn: mysql.Connection,
    gameId: number,
    turnCount: number
  ): Promise<Turn>

  findByTurnCount(turnCount: number): Promise<Turn | undefined>

  save(conn: mysql.Connection, turn: Turn):Promise<void>

  findLatestForGame(
    conn: mysql.Connection,
    gameId: number
  ): Promise<Turn | undefined>

  delete(
    conn: mysql.Connection,
    gameId: number,
    turnCount: number
  ): Promise<void>
}
