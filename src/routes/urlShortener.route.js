const express = require("express");
const router = express.Router();

const urlShortenerController = require("../controllers/urlShortener.controller");

router.get("/", (req, res) => {
  res.status(200).send("Hello World");
});

//Crear url corta a partir de una larga
router.post("/create", urlShortenerController.createShort);

//Retornar url larga en base a una corta
router.get("/longUrl/:shortUrl", urlShortenerController.getLongUrl);

//Redireccionar url corta a url larga
router.get("/:shortUrl", urlShortenerController.shortRedirect);

//Eliminar url corta
router.delete("/:id", urlShortenerController.remove);

module.exports = router;
