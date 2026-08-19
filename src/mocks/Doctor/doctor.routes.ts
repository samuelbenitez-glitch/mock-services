import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { DoctorController } from "./doctor.controller";

// Registra el endpoint del mock Doctor.
// Espeja el endpoint real POST /doctor/[producto] del api-doctor (PHP).
// Ej: http://localhost:3101/doctor/MAPI
//
// - Extrae el codcli del JWT (header Authorization: Bearer <token>).
// - Guarda el codcli en memoria: 201 si es nuevo, 200 si ya existia.
export const registerDoctorRoutes = (
  server: FastifyInstance,
  controller: DoctorController,
) => {
  server.post(
    "/doctor/:producto",
    async (request: FastifyRequest, reply: FastifyReply) => {
      return controller.generarDoctor(request as any, reply);
    },
  );
};
