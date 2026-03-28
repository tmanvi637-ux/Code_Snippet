const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const jwt = require("jsonwebtoken");

const optionalAuth = (req, res, next) => {
    let token = req.header("Authorization");
    if (token) {
        if (token.startsWith("Bearer ")) token = token.slice(7, token.length).trimLeft();
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret");
            req.user = decoded.id;
        } catch (e) {}
    }
    next();
};

const {
    createSnippet,
    getPublicSnippets,
    forkSnippet,
    getUserSnippets,
    getSnippetById,
    updateSnippet,
    deleteSnippet
} = require("../controllers/snippetController");

router.post("/", auth, createSnippet);
router.get("/", getPublicSnippets);
router.get("/mine", auth, getUserSnippets);

// api/snippet/ S1/S2/S3....

router.get("/:id", optionalAuth, getSnippetById);
router.put("/:id", auth, updateSnippet);
router.delete("/:id", auth, deleteSnippet);



router.post("/fork/:id", auth, forkSnippet);

module.exports = router;