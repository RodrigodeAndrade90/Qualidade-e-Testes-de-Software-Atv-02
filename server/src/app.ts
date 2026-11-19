import express, { type ErrorRequestHandler } from "express";
import { STATUS_CODES } from "node:http";
import { HttpError } from "./errors";
import type { Database } from "./database/connection";
import { PgStudentRepository } from "./modules/students/students.repository";
import { PgCourseRepository } from "./modules/courses/courses.repository";
import { PgEnrollmentRepository } from "./modules/enrollments/enrollments.repository";
import { StudentsService } from "./modules/students/students.service";
import { CoursesService } from "./modules/courses/courses.service";
import { EnrollmentsService } from "./modules/enrollments/enrollments.service";
import { studentsRoutes } from "./modules/students/students.routes";
import { coursesRoutes } from "./modules/courses/courses.routes";
import { enrollmentsRoutes } from "./modules/enrollments/enrollments.routes";

// A criação da aplicação não inicia o servidor nem acessa o banco.
export function createApp(db: Database) {
  const app = express();
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // Os serviços consultam o banco por meio dos respectivos repositórios.
  const studentRepository = new PgStudentRepository(db);
  const courseRepository = new PgCourseRepository(db);
  const enrollmentRepository = new PgEnrollmentRepository(db);

  const studentsService = new StudentsService(studentRepository);
  const coursesService = new CoursesService(courseRepository);
  const enrollmentsService = new EnrollmentsService(enrollmentRepository);

  // Direciona as chamadas às rotas de cada tipo de recurso.
  app.use("/api/students", studentsRoutes(studentsService));
  app.use("/api/courses", coursesRoutes(coursesService));
  app.use("/api/enrollments", enrollmentsRoutes(enrollmentsService));

  app.use((_req, _res, next) => {
    next(new HttpError(404, "Não encontramos essa rota."));
  });

  // O Express reconhece esta função de erro pelos quatro argumentos.
  const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
    let statusCode = 500;
    let message = "O servidor encontrou um problema inesperado.";

    if (error instanceof HttpError) {
      statusCode = error.statusCode;
      message = error.message;
    } else if (error?.type === "entity.parse.failed") {
      statusCode = 400;
      message = "O conteúdo JSON enviado é inválido.";
    } else if (error?.type === "entity.too.large") {
      statusCode = 413;
      message = "O conteúdo enviado excede o tamanho permitido.";
    } else {
      console.error(error);
    }

    res
      .status(statusCode)
      .json({ statusCode, message, error: STATUS_CODES[statusCode] });
  };
  app.use(errorHandler);

  return app;
}
