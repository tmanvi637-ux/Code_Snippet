require("dotenv").config();  // 🔥 must be first

const sequelize = require("./config/database");
const app = require("./app");

const PORT = 5000;

sequelize.sync({ alter: true })
.then(() => {
    console.log("Database synced");
    app.listen(PORT, () => console.log("Server running on port ", PORT));
})
.catch(err => console.error("Error syncing database:", err));