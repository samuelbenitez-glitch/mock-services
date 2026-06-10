import pino from "pino";
import pretty from "pino-pretty";
import { join } from "path";
import { createStream } from "rotating-file-stream";

export const buildLogger = () => {
  const generator = (time: Date | null) => {
    if (!time) {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}.log`;
    }

    const year = time.getFullYear();
    const month = String(time.getMonth() + 1).padStart(2, "0");
    const day = String(time.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}.log`;
  };

  const rotatingStream = createStream(generator, {
    interval: "1d",
    maxFiles: 10,
    path: join(process.cwd(), "storage", "logs"),
    compress: "gzip",
  });

  // Formatea cada entrada en modo legible (pretty) antes de escribirla al
  // archivo rotado. colorize:false para no meter códigos ANSI en el .log.
  const prettyStream = pretty({
    colorize: false,
    translateTime: "yyyy-mm-dd HH:MM:ss",
    ignore: "pid,hostname",
    destination: rotatingStream,
  });

  return pino(
    {
      level: "info",
      formatters: {
        level: (label) => {
          return { level: label };
        },
      },
    },
    prettyStream,
  );
};

export type Logger = ReturnType<typeof buildLogger>;
