const express = require("express");
const app = express();
const port = 3000;

app.use(express.json({ limit: "30mb", extended: true }));
app.use(express.urlencoded({ limit: "30mb", extended: true }));

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const NodeCache = require("node-cache");
const cache = new NodeCache();

app.get("/", (req, res) => {
  const dateObject = new Date();
  console.log(dateObject);
  res.status(200).send("Hello World");
});

//TODO: mover esto a .env
const DOMAIN = "http://localhost:3000/";

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

app.get("/longUrl/:shortUrl", async (req, res) => {
  const { shortUrl: _shortUrl } = req.params;

  const url = await prisma.url.findUnique({
    where: {
      shortUrl: _shortUrl,
    },
  });

  res.status(200).send(url.longUrl);
});

app.get("/:shortUrl", async (req, res) => {
  const { shortUrl: _shortUrl } = req.params;

  try {
    let urlObj;
    const cacheResults = cache.get(_shortUrl);

    if (cacheResults) {
      console.log("url desde cache");
      urlObj = cacheResults;
    } else {
      console.log("url desde db");
      urlObj = await prisma.url.findUnique({
        where: {
          shortUrl: _shortUrl,
        },
      });

      cacheResponse = cache.set(urlObj.shortUrl, urlObj);

      if (cacheResponse) {
        console.log("se guardó correctamente en caché");
      } else {
        console.log("error al guardar en caché");
      }
    }

    console.log(urlObj);
    if (urlObj == null) {
      res.status(404).send("No encontramos la url");
      return false;
    }

    /*await prisma.urlLog.create({
      data: {
        urlId: urlObj.id,
      },
    });*/

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
