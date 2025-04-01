import { connectMySQL } from "../../infrastructure/connection"
import { FindLastGameQueryService, FindLastGamesQueryModel } from "../query/findLastGamesQueryService"

const FIND_COUNT = 10

export class FindLastGameUseCase{
  constructor(private _queryService: FindLastGameQueryService){}
  
  async run(): Promise<FindLastGamesQueryModel[]>{
    const conn = await connectMySQL()

    try{
      return await this._queryService.query(conn, FIND_COUNT)
    }finally{
      conn.end()
    }
  }
}