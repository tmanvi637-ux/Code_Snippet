const express = require("express");
const cors = require("cors"); // CROSS ORIGIN RESOURCE SHARING

const app = express();

app.use(cors());
// BODY PARSER - Alternative
app.use(express.json());

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/snippets", require("./routes/snippetRoutes"));

module.exports = app;