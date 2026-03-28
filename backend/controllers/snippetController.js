const Snippet = require("../models/Snippet");
const User = require("../models/User");

// CREATE
exports.createSnippet = async (req, res) => {
    try {
        const snippet = await Snippet.create({
            ...req.body,
            userId: req.user
        });
        res.json(snippet);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// GET PUBLIC
exports.getPublicSnippets = async (req, res) => {
    try {
        const snippets = await Snippet.findAll({ 
            where: { isPublic: true },
            include: [{ model: User, attributes: ['username'] }]
        });
        res.json(snippets);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// FORK
exports.forkSnippet = async (req, res) => {
    try {
        const original = await Snippet.findByPk(req.params.id);
        if (!original) {
            return res.status(404).json({ msg: "Snippet not found" });
        }

        // Check privacy for fork
        if (!original.isPublic && original.userId !== req.user) {
            return res.status(403).json({ msg: "Cannot fork a private snippet" });
        }

        const forked = await Snippet.create({
            title: original.title,
            code: original.code,
            language: original.language,
            userId: req.user,
            forkedFromId: original.id
        });

        res.json(forked);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// GET USER SNIPPETS
exports.getUserSnippets = async (req, res) => {
    try {
        const snippets = await Snippet.findAll({
            where: { userId: req.user },
            include: [{ model: User, attributes: ['username'] }]
        });
        res.json(snippets);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// GET BY ID
exports.getSnippetById = async (req, res) => {
    try {

        // param.id - S1/S2/S3...

        const snippet = await Snippet.findByPk(req.params.id, {
            include: [{ model: User, attributes: ['username'] }]
        });
        if (!snippet) {
            return res.status(404).json({ msg: "Snippet not found" });
        }
        
        if (!snippet.isPublic && snippet.userId !== req.user) {
            return res.status(403).json({ msg: "Access denied" });
        }
        
        res.json(snippet);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// UPDATE
exports.updateSnippet = async (req, res) => {
    try {
        const snippet = await Snippet.findByPk(req.params.id);
        if (!snippet) {
            return res.status(404).json({ msg: "Snippet not found" });
        }
        if (snippet.userId !== req.user) {
            return res.status(403).json({ msg: "Not authorized to update this snippet" });
        }

        const { title, code, language, isPublic } = req.body;

        if (title !== undefined) snippet.title = title;
        if (code !== undefined) snippet.code = code;
        if (language !== undefined) snippet.language = language;
        if (isPublic !== undefined) snippet.isPublic = isPublic;

        await snippet.save();
        res.json(snippet);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// DELETE
exports.deleteSnippet = async (req, res) => {
    try {
        const snippet = await Snippet.findByPk(req.params.id);
        if (!snippet) {
            return res.status(404).json({ msg: "Snippet not found" });
        }
        if (snippet.userId !== req.user) {
            return res.status(403).json({ msg: "Not authorized to delete this snippet" });
        }

        await snippet.destroy();
        res.json({ msg: "Snippet deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};