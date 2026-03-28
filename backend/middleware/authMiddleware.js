const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
    let token = req.header("Authorization");

    if (!token) return res.status(401).json({ msg: "No token" });

    if (token.startsWith("Bearer ")) {
        token = token.slice(7, token.length).trimLeft();
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret");
        req.user = decoded.id;
        next();
    } catch {
        res.status(401).json({ msg: "Invalid token" });
    }
};