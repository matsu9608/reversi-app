import express from 'express'
import 'express-async-errors'
import morgan from 'morgan'
import mysql from 'mysql2/promise'
import { GameGateway } from './dataaccess/gameGateway'
import { MoveGateway } from './dataaccess/moveGateway'
import { SquareGateway } from './dataaccess/squareGateway'
import { TurnGateway } from './dataaccess/turnGateway'
import { gameRouter } from './presentation/gameRouter'
import { turnRouter } from './presentation/turnRouter'

const EMPTY = 0
const DARK = 1
const LIGHT = 2

const INITIAL_BOARD = [
  [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
  [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
  [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
  [EMPTY, EMPTY, EMPTY, DARK, LIGHT, EMPTY, EMPTY, EMPTY],
  [EMPTY, EMPTY, EMPTY, LIGHT, DARK, EMPTY, EMPTY, EMPTY],
  [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
  [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
  [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY]
]

const PORT = 3000

const app = express()

app.use(morgan('dev'))
app.use(express.static('static', { extensions: ['html'] }))
app.use(express.json())

app.use(gameRouter)
app.use(turnRouter)

app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`Reversi application started: http://localhost:${PORT}`)
})

function errorHandler(
  err: any,
  _req: express.Request,
  res: express.Response,
  _next: express.NextFunction
) {
  console.error('Unexpected error occurred', err)
  res.status(500).send({
    message: 'Unexpected error occurred'
  })
}

async function connectMySQL() {
  return await mysql.createConnection({
    host: 'localhost',
    database: 'reversi',
    user: 'reversi',
    password: 'password'
  })
}
