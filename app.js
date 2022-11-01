const express = require("express");
const app = express();
const redis = require("redis");
const bull = require("bull");
const port = 3000;

app.use(express.json({ limit: "30mb", extended: true }));
app.use(express.urlencoded({ limit: "30mb", extended: true }));

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const redisCacheClient = redis.createClient(6379);

const bullQueue = new bull("urlQueue", {
  redis: { port: 6380 },
});

redisCacheClient.on("error", (error) => {
  console.error(error);
});

redisCacheClient.connect();

app.get("/", (req, res) => {
  const dateObject = new Date();
  console.log(dateObject);
  res.status(200).send("Hello World");
});

//TODO: mover esto a .env
const DOMAIN = "http://localhost:3000/";

//Crear url corta a partir de una larga
app.post("/shortener", async (req, res) => {
  console.log(req.body);
  const longUrl = req.body.longUrl;
  const shortUrl = (Math.random() + 1).toString(36).substring(6);

  //url larga debe venir en formato https:// si no viene así, agregalo.

  await prisma.url.create({
    data: {
      shortUrl: shortUrl,
      longUrl: longUrl,
    },
  });

  res.status(200).send(DOMAIN + "" + shortUrl);
});

//Retornar url larga en base a una corta
app.get("/longUrl/:shortUrl", async (req, res) => {
  const { shortUrl: _shortUrl } = req.params;

  const url = await prisma.url.findUnique({
    where: {
      shortUrl: _shortUrl,
    },
  });

  res.status(200).send(url.longUrl);
});

//Funcionalidad redireccionar url corta a larga
app.get("/:shortUrl", async (req, res) => {
  const { shortUrl: _shortUrl } = req.params;
  try {
    let urlObj;
    const cacheResult = await redisCacheClient.get(_shortUrl);

    if (cacheResult) {
      urlObj = JSON.parse(cacheResult);
    } else {
      //leer url desde la bd
      urlObj = await prisma.url.findUnique({
        where: {
          shortUrl: _shortUrl,
        },
      });

      if (urlObj == null) {
        res.status(404).send("No encontramos la url");
        return false;
      }

      //almacenar en caché la url para próximas peticiones
      cacheResponse = redisCacheClient.setEx(
        urlObj.shortUrl,
        1440,
        JSON.stringify(urlObj)
      );
    }

    //agregar inserción de estadistica en la cola
    const date = new Date();

    await bullQueue.add({
      urlId: urlObj.id,
      date: date,
    });

    res.redirect(urlObj.longUrl);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

app.on("error", (error) => {
  console.error(error);
});
