import { TurnRepository } from "../../domain/model/turn/turnRepository";
import { ApplicationError } from "../error/applicationError";

interface FindValidMovesUseCaseOutput {
  disc: number;
  x: number;
  y: number;
}

export class FindValidMovesUseCase {
  constructor(private turnRepository: TurnRepository) {}

  async run(turnCount: number): Promise<FindValidMovesUseCaseOutput[]> {
    // 指定されたターン数の手を取得
    const turn = await this.turnRepository.findByTurnCount(turnCount);
    if (!turn) {
      throw new ApplicationError(
        "TurnNotFound",
        `Turn not found for turnCount=${turnCount}`
      );
    }

    // 次の石がない場合はゲーム終了しているため、空の配列を返す
    if (!turn.nextDisc) {
      return [];
    }

    // 有効な手のリストを取得
    const validMoves = turn.board.listValidMoves(turn.nextDisc);
    
    // 出力形式に変換
    return validMoves.map(move => {
      return {
        disc: turn.nextDisc!,
        x: move.x,
        y: move.y
      };
    });
  }
} 