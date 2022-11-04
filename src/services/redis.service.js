const redis = require("ioredis");
const bull = require("bull");

let redisCacheUp = true;
let redisQueueUp = true;

const redisCacheClient = redis.createClient({
  host: "redis_cache",
  port: 6379,
  retryStrategy: (times) => {
    const delay = 2000;
    return delay;
  },
});

const bullQueue = new bull("urlQueue", {
  redis: {
    host: "redis_queue",
    port: 6379,
  },
});

bullQueue.on("error", (error) => {
  console.error("no se pudo conectar a redis queue", error.message);
  redisQueueUp = false;
});

bullQueue.on("connect", () => {
  console.log("conectado a redis caché");
  redisQueueUp = true;
});

redisCacheClient.on("error", (error) => {
  console.error("no se pudo conectar a redis cache", error.message);
  redisCacheUp = false;
});
redisCacheClient.on("connect", () => {
  redisCacheUp = true;
});

const isRedisCacheUp = () => {
  return redisCacheUp;
};
const isRedisQueueUp = () => {
  return redisQueueUp;
};

module.exports = {
  redisCacheClient,
  bullQueue,
  isRedisCacheUp,
  isRedisQueueUp,
};
