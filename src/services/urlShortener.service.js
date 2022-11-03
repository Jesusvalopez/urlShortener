const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const {
  redisCacheClient,
  bullQueue,
  isRedisCacheUp,
  isRedisQueueUp,
} = require("./redis.service");

//TODO: mover esto a .env
const DOMAIN = "http://localhost:3000/";

async function createShort(longUrl) {
  const shortUrl = (Math.random() + 1).toString(36).substring(6);

  //url larga debe venir en formato https:// si no viene así, agregalo.

  await prisma.url.create({
    data: {
      shortUrl: shortUrl,
      longUrl: longUrl,
    },
  });

  return DOMAIN + "" + shortUrl;
}

//Retornar url larga en base a una corta
async function getLongUrl(_shortUrl) {
  const url = await prisma.url.findUnique({
    where: {
      shortUrl: _shortUrl,
    },
  });

  return url.longUrl;
}

//Redireccionar url corta a larga
async function shortRedirect(_shortUrl) {
  let urlObj;
  let cacheResult;
  const initDate = new Date().getTime();

  if (isRedisCacheUp()) {
    //leer desde caché
    cacheResult = await redisCacheClient.get(_shortUrl);
  }

  if (cacheResult) {
    urlObj = JSON.parse(cacheResult);
  } else {
    //leer url desde la bd
    urlObj = await readUrlFromDB(_shortUrl);
    //almacenar en caché la url para próximas peticiones
    if (isRedisCacheUp()) {
      cacheResponse = redisCacheClient.set(
        urlObj.shortUrl,
        JSON.stringify(urlObj)
      );
    }
  }

  //agregar inserción de estadistica en la cola
  await insertUrlUseStats(urlObj);

  const finalDate = new Date().getTime();
  console.log(finalDate - initDate);

  return urlObj.longUrl;
}

async function readUrlFromDB(_shortUrl) {
  urlObj = await prisma.url.findUnique({
    where: {
      shortUrl: _shortUrl,
    },
  });

  if (urlObj == null) {
    res.status(404).send("No encontramos la url");
    return false;
  }

  return urlObj;
}

async function insertUrlUseStats(urlObj) {
  const date = new Date();
  if (isRedisQueueUp()) {
    await bullQueue.add({
      urlId: urlObj.id,
      date: date,
    });
  } else {
    await prisma.urlLog.create({
      data: {
        urlId: urlObj.id,
        createdAt: date,
      },
    });
  }
}

async function remove(_id) {
  await prisma.url.update({
    where: { id: _id },
    data: {
      deletedAt: new Date(),
    },
  });

  return "Url eliminada con éxito";
}

module.exports = {
  createShort,
  getLongUrl,
  shortRedirect,
  remove,
};
