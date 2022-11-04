const express = require("express");
const app = express();
const port = process.env.PORT || 3000;
app.use(express.json({ limit: "30mb", extended: true }));
app.use(express.urlencoded({ limit: "30mb", extended: true }));

const urlShortener = require("./src/routes/urlShortener.route");

app.use("/", urlShortener);

app.listen(port, () => {
  console.log(`App online en puerto: ${port}`);
});

app.on("error", (error) => {
  console.error(error);
});
