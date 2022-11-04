const bull = require("bull");
const { PrismaClient } = require("@prisma/client");

const bullQueue = new bull("urlQueue", {
  redis: { host: "redis_queue", port: 6379 },
});

const prisma = new PrismaClient();

bullQueue.process(async (job, done) => {
  console.log(job.data);
  try {
    await prisma.urlLog.create({
      data: {
        urlId: job.data.urlId,
        createdAt: job.data.date,
      },
    });
  } catch (error) {
    console.error("Ha ocurrido un error al procesar la cola", error.message);
    done(new Error("Ha ocurrido un error al procesar la cola"));
  }
  done();
});
