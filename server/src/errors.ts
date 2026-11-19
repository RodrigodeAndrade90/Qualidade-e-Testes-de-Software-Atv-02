// Representa falhas previstas, como entrada inválida ou item não localizado.
export class HttpError extends Error {
  constructor(public readonly statusCode: number, message: string) {
    super(message);
  }
}
