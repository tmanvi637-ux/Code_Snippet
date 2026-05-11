require("dotenv").config();  // 🔥 must be first

const sequelize = require("./config/database");
const app = require("./app");

const PORT = 5100;

sequelize.sync({ alter: true })
.then(() => {
    console.log("Database synced");
    app.listen(PORT, () => console.log("Server running on http://localhost:", PORT));
})
.catch(err => console.error("Error syncing database:", err));