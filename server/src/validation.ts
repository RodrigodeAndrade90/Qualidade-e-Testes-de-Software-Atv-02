import { HttpError } from './errors';

export function positiveInteger(value: unknown, field: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0 || value > 2147483647) {
    throw new HttpError(400, field + ' precisa ser um número inteiro positivo de no máximo 2147483647.');
  }
  return value;
}

export function parseId(value: unknown, field: string): number {
  if (typeof value !== 'string' || !/^\d+$/.test(value)) {
    throw new HttpError(400, field + ' precisa ser informado como inteiro positivo.');
  }
  return positiveInteger(Number(value), field);
}

export function validateName(value: unknown): string {
  if (typeof value !== 'string' || value.trim().length < 3 || value.length > 100) {
    throw new HttpError(400, 'O nome precisa ter de 3 a 100 caracteres, sem contar os espaços no começo e no fim.');
  }
  return value;
}

export function validateBody(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new HttpError(400, 'Envie um objeto JSON no corpo da solicitação.');
  }
  return value as Record<string, unknown>;
}
