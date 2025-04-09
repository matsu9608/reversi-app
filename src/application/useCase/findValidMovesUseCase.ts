import { TurnRepository } from "../../domain/model/turn/turnRepository";
import { ApplicationError } from "../error/applicationError";

export class FindValidMovesUseCase {
  constructor(private turnRepository: TurnRepository) {}

  async run(turnCount: number): Promise<{ disc: number; x: number; y: number }[]> {
    const turn = await this.turnRepository.findByTurnCount(turnCount);
    if (!turn) {
      throw new ApplicationError("TurnNotFound", `Turn not found for turnCount=${turnCount}`);
    }

    if (!turn.nextDisc) {
      return [];
    }

    return turn.board.listValidMoves(turn.nextDisc).map(({ x, y }) => ({
      disc: turn.nextDisc!,
      x,
      y,
    }));
  }
} 