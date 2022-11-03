const urlShortenerService = require("../services/urlShortener.service");

//Crear url corta a partir de una larga
async function createShort(req, res) {
  try {
    const longUrl = req.body.longUrl;
    res.status(201).send(await urlShortenerService.createShort(longUrl));
  } catch (error) {
    console.error("Error intentando crear url corta", error.message);
    res.status(500).json("Ha ocurrido un error al procesar su solicitud");
  }
}

//Retornar url larga en base a una corta
async function getLongUrl(req, res) {
  try {
    const { shortUrl: _shortUrl } = req.params;
    res.status(200).send(await urlShortenerService.getLongUrl(_shortUrl));
  } catch (error) {
    console.error("Error al devolver url larga", error.message);
    res.status(500).json("Ha ocurrido un error al procesar su solicitud");
  }
}

//Funcionalidad redireccionar url corta a larga
async function shortRedirect(req, res) {
  const { shortUrl: _shortUrl } = req.params;
  try {
    const url = await urlShortenerService.shortRedirect(_shortUrl);

    if (url == null) {
      res.status(404).send("No hemos encontrado la url");
      return false;
    }
    res.redirect(url);
  } catch (error) {
    console.error("Error al redireccionar url corta a larga", error.message);
    res.status(500).json("Ha ocurrido un error al procesar su solicitud");
  }
}

async function remove(req, res) {
  const { id: _id } = req.params;
  try {
    res.status(200).send(await urlShortenerService.remove(_id));
  } catch (error) {
    console.error("Error al eliminar url corta", error.message);
    res.status(500).json("Ha ocurrido un error al eliminar");
  }
}

module.exports = {
  createShort,
  getLongUrl,
  shortRedirect,
  remove,
};
