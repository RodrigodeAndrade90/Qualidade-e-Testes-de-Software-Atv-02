import { HttpError } from "../../errors";
import { positiveInteger, validateBody } from "../../validation";
import { isUniqueViolation } from "../../database/unique-violation";
import { isForeignKeyViolation } from "../../database/foreign-key-violation";
import type { EnrollmentRepository } from "./enrollments.repository";

export class EnrollmentsService {
  constructor(private readonly repository: EnrollmentRepository) {}

  async create(input: unknown) {
    const data = validateBody(input);
    const studentRa = positiveInteger(data.studentRa, "RA");
    const courseId = positiveInteger(data.courseId, "ID do curso");
    try {
      return await this.repository.create(studentRa, courseId);
    } catch (error) {
      if (isForeignKeyViolation(error))
        throw new HttpError(
          404,
          "Não localizamos o estudante ou a disciplina para concluir a matrícula.",
        );
      if (isUniqueViolation(error))
        throw new HttpError(
          409,
          "A matrícula deste estudante para a disciplina já foi registrada.",
        );
      throw error;
    }
  }

  findAll() {
    return this.repository.findAll();
  }

  async findOne(studentRa: number, courseId: number) {
    positiveInteger(studentRa, "RA");
    positiveInteger(courseId, "ID do curso");
    const record = await this.repository.findOne(studentRa, courseId);
    if (!record) throw new HttpError(404, "Não localizamos essa matrícula.");
    return record;
  }

}
