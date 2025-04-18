import { DomainError } from "../../error/domainError";
import { WinnerDisc } from "../gameResult/winnerDisc";
import { Board, initialBoard } from "./board";
import { Disc } from "./disc";
import { Move } from "./move";
import { Point } from "./point";

export class Turn {
  constructor(
    private _gameId: number,
    private _turnCount: number,
    private _nextDisc: Disc | undefined,
    private _move: Move | undefined,
    private _board: Board,
    private _endAt: Date
  ) {}

  placeNext(disc: Disc, point: Point): Turn {
    // 打とうとした石が、次の石ではない場合、置くことはできない
    if (disc !== this._nextDisc) {
      throw new DomainError(
        "SelectedDiscIsNotNextDisc",
        "Selected Disc Is Not Next Disc"
      );
    }

    const move = new Move(disc, point);

    const nextBoard = this._board.place(move);

    const nextDisc = this.decideNextDisc(nextBoard, disc);

    disc === Disc.Dark ? Disc.Light : Disc.Dark;

    return new Turn(
      this._gameId,
      this._turnCount + 1,
      nextDisc,
      move,
      nextBoard,
      new Date()
    );
  }

  gameEnded():boolean{
    return this.nextDisc === undefined
  }

  winnerDisc(): WinnerDisc{
    const darkCount = this._board.count(Disc.Dark)
    const lightCount = this._board.count(Disc.Light)

    if (darkCount === lightCount){
      return WinnerDisc.Draw
    }else if(darkCount > lightCount){
      return WinnerDisc.Dark
    }else{
      return WinnerDisc.Light
    }
  }

  private decideNextDisc(board: Board, previousDisc: Disc): Disc | undefined {
    const existDarkValidMove = board.existValidMove(Disc.Dark);
    const existLightValidMove = board.existValidMove(Disc.Light);

    if (existDarkValidMove && existLightValidMove) {
      return previousDisc == Disc.Dark ? Disc.Light : Disc.Dark;
    } else if (!existDarkValidMove && !existLightValidMove) {
      return undefined;
    } else if (existDarkValidMove) {
      return Disc.Dark;
    } else {
      return Disc.Light;
    }
  }

  get gameId() {
    return this._gameId;
  }

  get turnCount() {
    return this._turnCount;
  }

  get nextDisc() {
    return this._nextDisc;
  }

  get move() {
    return this._move;
  }

  get board() {
    return this._board;
  }

  get endAt() {
    return this._endAt;
  }
}

export function firstTurn(gameId: number, endAt: Date): Turn {
  return new Turn(gameId, 0, Disc.Dark, undefined, initialBoard, endAt);
}
