import pino from "pino";
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

  const stream = createStream(generator, {
    interval: "1d",
    maxFiles: 10,
    path: join(process.cwd(), "storage", "logs"),
    compress: "gzip",
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
    stream,
  );
};

export type Logger = ReturnType<typeof buildLogger>;
