import express from "express";
import "express-async-errors";
import morgan from "morgan";
import { gameRouter } from "./presentation/gameRouter";
import { turnRouter } from "./presentation/turnRouter";
import { DomainError } from "./domain/error/domainError";
import { ApplicationError } from "./application/error/applicationError";

const PORT = 3000;

const app = express();

app.use(morgan("dev"));
app.use(express.static("static", { extensions: ["html"] }));
app.use(express.json());

app.use(gameRouter);
app.use(turnRouter);

// Improved error handling middleware
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Reversi application started: http://localhost:${PORT}`);
});

// Enhanced error handler with specific error types
function errorHandler(
  err: unknown, // Use 'unknown' for better type safety
  _req: express.Request,
  res: express.Response,
  _next: express.NextFunction
) {
  if (err instanceof DomainError) {
    return res.status(400).json({
      type: err.type,
      message: err.message,
    });
  }

  if (err instanceof ApplicationError) {
    const statusCode = err.type === 'LatestGameNotFound' ? 404 : 500; // Default to 500 for other ApplicationErrors
    return res.status(statusCode).json({
      type: err.type,
      message: err.message,
    });
  }

  console.error("Unexpected error occurred", err);
  res.status(500).send({
    message: "An unexpected error has occurred. Please try again later or contact support if the issue persists.",
  });
}
