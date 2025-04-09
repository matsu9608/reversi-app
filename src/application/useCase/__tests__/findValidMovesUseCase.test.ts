import { TurnRepository } from "../../../domain/model/turn/turnRepository";
import { ApplicationError } from "../../error/applicationError";
import { FindValidMovesUseCase } from "../findValidMovesUseCase";

describe('FindValidMovesUseCase', () => {
  let turnRepository: TurnRepository;
  let findValidMovesUseCase: FindValidMovesUseCase;

  beforeEach(() => {
    turnRepository = {
      findByTurnCount: jest.fn(),
    } as unknown as TurnRepository;
    findValidMovesUseCase = new FindValidMovesUseCase(turnRepository);
  });

  it('should return valid moves for the given turn count', async () => {
    const turnCount = 1;
    const mockTurn = {
      nextDisc: 1,
      board: {
        listValidMoves: jest.fn().mockReturnValue([{ x: 2, y: 3 }, { x: 4, y: 5 }]),
      },
    };

    (turnRepository.findByTurnCount as jest.Mock).mockResolvedValue(mockTurn);

    const result = await findValidMovesUseCase.run(turnCount);

    expect(result).toEqual([
      { disc: 1, x: 2, y: 3 },
      { disc: 1, x: 4, y: 5 },
    ]);
    expect(turnRepository.findByTurnCount).toHaveBeenCalledWith(turnCount);
  });

  it('should throw an ApplicationError if turn is not found', async () => {
    const turnCount = 2;

    (turnRepository.findByTurnCount as jest.Mock).mockResolvedValue(null);

    await expect(findValidMovesUseCase.run(turnCount)).rejects.toThrow(ApplicationError);
    await expect(findValidMovesUseCase.run(turnCount)).rejects.toThrow('Turn not found for turnCount=2');
  });

  it('should return an empty array if there is no next disc', async () => {
    const turnCount = 3;
    const mockTurn = {
      nextDisc: null,
      board: {},
    };

    (turnRepository.findByTurnCount as jest.Mock).mockResolvedValue(mockTurn);

    const result = await findValidMovesUseCase.run(turnCount);

    expect(result).toEqual([]);
  });
}); 