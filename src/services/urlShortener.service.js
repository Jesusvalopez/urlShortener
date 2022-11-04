const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const {
  redisCacheClient,
  bullQueue,
  isRedisCacheUp,
  isRedisQueueUp,
} = require("./redis.service");

//TODO: mover esto a .env
const DOMAIN = "http://localhost/";

function randomString(length) {
  var mask = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  return [...Array(length)].reduce(
    (result) => result + mask[~~(Math.random() * mask.length)],
    ""
  );
}

async function createShort(longUrl) {
  let shortUrl = randomString(6);

  if (longUrl.indexOf("http://") == -1 && longUrl.indexOf("https://") == -1) {
    longUrl = "https://" + longUrl;
  }

  try {
    await prisma.url.create({
      data: {
        shortUrl: shortUrl,
        longUrl: longUrl,
      },
    });
  } catch (error) {
    console.log(error.message);
    //reintento
    shortUrl = randomString(6);
    await prisma.url.create({
      data: {
        shortUrl: shortUrl,
        longUrl: longUrl,
      },
    });
  }
  return DOMAIN + "" + shortUrl;
}

//Retornar url larga en base a una corta
async function getLongUrl(_shortUrl) {
  const url = await prisma.url.findFirst({
    where: {
      shortUrl: _shortUrl,
      deletedAt: null,
    },
  });

  if (url == null) {
    return null;
  }

  return url.longUrl;
}

//Redireccionar url corta a larga
async function shortRedirect(_shortUrl) {
  let urlObj;
  let cacheResult;

  if (isRedisCacheUp()) {
    //leer desde caché
    cacheResult = await redisCacheClient.get(_shortUrl);
  }

  if (cacheResult) {
    urlObj = JSON.parse(cacheResult);
  } else {
    //leer url desde la bd
    urlObj = await readUrlFromDB(_shortUrl);

    if (urlObj == null) {
      return null;
    }

    //almacenar en caché la url para próximas peticiones
    if (isRedisCacheUp()) {
      cacheResponse = redisCacheClient.set(
        urlObj.shortUrl,
        JSON.stringify(urlObj),
        "EX",
        1440
      );
    }
  }

  //agregar inserción de estadistica en la cola
  await insertUrlUseStats(urlObj);

  return urlObj.longUrl;
}

async function readUrlFromDB(_shortUrl) {
  urlObj = await prisma.url.findFirst({
    where: {
      shortUrl: _shortUrl,
      deletedAt: null,
    },
  });

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
  const url = await prisma.url.update({
    where: { id: parseInt(_id) },
    data: {
      deletedAt: new Date(),
    },
  });

  if (isRedisCacheUp()) {
    redisCacheClient.del(url.shortUrl);
  }
  return "Url eliminada con éxito";
}

module.exports = {
  createShort,
  getLongUrl,
  shortRedirect,
  remove,
};
