/**
 * ============================================
 *  UNIT TESTS — Code Snippet Platform
 * ============================================
 *  Tests individual functions/modules in isolation
 *  using mocks (no real DB or HTTP calls).
 *
 *  Run:  npm run test:unit
 * ============================================
 */

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// ─── Mock Setup ──────────────────────────────────────────
// Mock mailer so no real emails are sent
jest.mock("../utils/mailer", () => ({
    sendWelcomeEmail: jest.fn(),
    sendForkNotificationEmail: jest.fn(),
}));

// Mock Sequelize models
jest.mock("../models/User", () => ({
    create: jest.fn(),
    findOne: jest.fn(),
    findByPk: jest.fn(),
}));

jest.mock("../models/Snippet", () => {
    const mock = {
        create: jest.fn(),
        findAll: jest.fn(),
        findByPk: jest.fn(),
    };
    // Mock associations (called at module load)
    mock.belongsTo = jest.fn();
    mock.hasMany = jest.fn();
    return mock;
});

const User = require("../models/User");
const Snippet = require("../models/Snippet");
const { sendWelcomeEmail, sendForkNotificationEmail } = require("../utils/mailer");
const authController = require("../controllers/authController");
const snippetController = require("../controllers/snippetController");
const authMiddleware = require("../middleware/authMiddleware");

// Helper: create mock req/res
const mockReq = (overrides = {}) => ({
    body: {},
    params: {},
    header: jest.fn(),
    user: null,
    ...overrides,
});

const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};


// ═══════════════════════════════════════════════
//  1. AUTH MIDDLEWARE
// ═══════════════════════════════════════════════
describe("Auth Middleware", () => {
    const SECRET = "secret";

    beforeEach(() => {
        process.env.JWT_SECRET = SECRET;
    });

    test("should return 401 if no token is provided", () => {
        const req = mockReq({ header: jest.fn().mockReturnValue(null) });
        const res = mockRes();
        const next = jest.fn();

        authMiddleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ msg: "No token" });
        expect(next).not.toHaveBeenCalled();
    });

    test("should call next() and set req.user with valid token", () => {
        const token = jwt.sign({ id: 42 }, SECRET, { expiresIn: "1d" });
        const req = mockReq({ header: jest.fn().mockReturnValue(`Bearer ${token}`) });
        const res = mockRes();
        const next = jest.fn();

        authMiddleware(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(req.user).toBe(42);
    });

    test("should return 401 with an invalid/expired token", () => {
        const req = mockReq({ header: jest.fn().mockReturnValue("Bearer invalidtoken123") });
        const res = mockRes();
        const next = jest.fn();

        authMiddleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ msg: "Invalid token" });
        expect(next).not.toHaveBeenCalled();
    });

    test("should handle token without Bearer prefix", () => {
        const token = jwt.sign({ id: 7 }, SECRET, { expiresIn: "1d" });
        const req = mockReq({ header: jest.fn().mockReturnValue(token) });
        const res = mockRes();
        const next = jest.fn();

        authMiddleware(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(req.user).toBe(7);
    });
});


// ═══════════════════════════════════════════════
//  2. AUTH CONTROLLER
// ═══════════════════════════════════════════════
describe("Auth Controller", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.JWT_SECRET = "testsecret";
    });

    // ── Register ──
    describe("register", () => {
        test("should create a user, send welcome email, and return user data", async () => {
            const fakeUser = { id: 1, username: "john", email: "john@test.com", password: "hashed" };
            User.create.mockResolvedValue(fakeUser);

            const req = mockReq({
                body: { username: "john", email: "john@test.com", password: "pass123" },
            });
            const res = mockRes();

            await authController.register(req, res);

            expect(User.create).toHaveBeenCalledTimes(1);
            expect(User.create).toHaveBeenCalledWith(
                expect.objectContaining({ username: "john", email: "john@test.com" })
            );
            expect(sendWelcomeEmail).toHaveBeenCalledWith("john@test.com", "john");
            expect(res.json).toHaveBeenCalledWith(fakeUser);
        });

        test("should hash the password before saving", async () => {
            User.create.mockResolvedValue({ id: 1 });

            const req = mockReq({
                body: { username: "jane", email: "jane@test.com", password: "mypassword" },
            });
            const res = mockRes();

            await authController.register(req, res);

            const savedPassword = User.create.mock.calls[0][0].password;
            // The saved password should NOT be the plaintext
            expect(savedPassword).not.toBe("mypassword");
            // It should be a valid bcrypt hash
            expect(savedPassword.startsWith("$2")).toBe(true);
        });

        test("should return 500 on database error", async () => {
            User.create.mockRejectedValue(new Error("Duplicate email"));

            const req = mockReq({
                body: { username: "john", email: "john@test.com", password: "pass123" },
            });
            const res = mockRes();

            await authController.register(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: "Duplicate email" });
        });
    });

    // ── Login ──
    describe("login", () => {
        test("should return a JWT token on valid credentials", async () => {
            const hashedPw = await bcrypt.hash("pass123", 10);
            User.findOne.mockResolvedValue({ id: 5, email: "a@b.com", password: hashedPw });

            const req = mockReq({ body: { email: "a@b.com", password: "pass123" } });
            const res = mockRes();

            await authController.login(req, res);

            expect(res.json).toHaveBeenCalled();
            const response = res.json.mock.calls[0][0];
            expect(response).toHaveProperty("token");
            // Verify the token decodes correctly
            const decoded = jwt.verify(response.token, "testsecret");
            expect(decoded.id).toBe(5);
        });

        test("should return 400 if user is not found", async () => {
            User.findOne.mockResolvedValue(null);

            const req = mockReq({ body: { email: "ghost@test.com", password: "nope" } });
            const res = mockRes();

            await authController.login(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ msg: "User not found" });
        });

        test("should return 400 on wrong password", async () => {
            const hashedPw = await bcrypt.hash("correctpass", 10);
            User.findOne.mockResolvedValue({ id: 1, email: "a@b.com", password: hashedPw });

            const req = mockReq({ body: { email: "a@b.com", password: "wrongpass" } });
            const res = mockRes();

            await authController.login(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ msg: "Invalid credentials" });
        });
    });
});


// ═══════════════════════════════════════════════
//  3. SNIPPET CONTROLLER
// ═══════════════════════════════════════════════
describe("Snippet Controller", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // ── Create ──
    describe("createSnippet", () => {
        test("should create a snippet with the authenticated user's ID", async () => {
            const fakeSnippet = { id: 1, title: "Test", code: "log(1)", userId: 3 };
            Snippet.create.mockResolvedValue(fakeSnippet);

            const req = mockReq({
                body: { title: "Test", code: "log(1)", language: "javascript", isPublic: true },
                user: 3,
            });
            const res = mockRes();

            await snippetController.createSnippet(req, res);

            expect(Snippet.create).toHaveBeenCalledWith(
                expect.objectContaining({ title: "Test", userId: 3 })
            );
            expect(res.json).toHaveBeenCalledWith(fakeSnippet);
        });
    });

    // ── Get Public ──
    describe("getPublicSnippets", () => {
        test("should return all public snippets", async () => {
            const fakeData = [{ id: 1, isPublic: true }, { id: 2, isPublic: true }];
            Snippet.findAll.mockResolvedValue(fakeData);

            const req = mockReq();
            const res = mockRes();

            await snippetController.getPublicSnippets(req, res);

            expect(Snippet.findAll).toHaveBeenCalledWith(
                expect.objectContaining({ where: { isPublic: true } })
            );
            expect(res.json).toHaveBeenCalledWith(fakeData);
        });
    });

    // ── Get By ID ──
    describe("getSnippetById", () => {
        test("should return a public snippet without auth", async () => {
            const fakeSnippet = { id: 1, isPublic: true, userId: 5 };
            Snippet.findByPk.mockResolvedValue(fakeSnippet);

            const req = mockReq({ params: { id: 1 }, user: null });
            const res = mockRes();

            await snippetController.getSnippetById(req, res);

            expect(res.json).toHaveBeenCalledWith(fakeSnippet);
        });

        test("should return 403 for a private snippet accessed by non-owner", async () => {
            const fakeSnippet = { id: 1, isPublic: false, userId: 5 };
            Snippet.findByPk.mockResolvedValue(fakeSnippet);

            const req = mockReq({ params: { id: 1 }, user: 99 });
            const res = mockRes();

            await snippetController.getSnippetById(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ msg: "Access denied" });
        });

        test("should return 404 if snippet does not exist", async () => {
            Snippet.findByPk.mockResolvedValue(null);

            const req = mockReq({ params: { id: 999 } });
            const res = mockRes();

            await snippetController.getSnippetById(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });
    });

    // ── Update ──
    describe("updateSnippet", () => {
        test("should update snippet fields and save", async () => {
            const fakeSnippet = {
                id: 1, title: "Old", code: "x", language: "js", isPublic: true,
                userId: 3, save: jest.fn().mockResolvedValue(true),
            };
            Snippet.findByPk.mockResolvedValue(fakeSnippet);

            const req = mockReq({
                params: { id: 1 },
                body: { title: "New Title", code: "console.log(1)" },
                user: 3,
            });
            const res = mockRes();

            await snippetController.updateSnippet(req, res);

            expect(fakeSnippet.title).toBe("New Title");
            expect(fakeSnippet.code).toBe("console.log(1)");
            expect(fakeSnippet.save).toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith(fakeSnippet);
        });

        test("should return 403 if non-owner tries to update", async () => {
            Snippet.findByPk.mockResolvedValue({ id: 1, userId: 5 });

            const req = mockReq({ params: { id: 1 }, body: { title: "Hack" }, user: 99 });
            const res = mockRes();

            await snippetController.updateSnippet(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
        });
    });

    // ── Delete ──
    describe("deleteSnippet", () => {
        test("should delete the snippet if owner", async () => {
            const fakeSnippet = { id: 1, userId: 3, destroy: jest.fn().mockResolvedValue(true) };
            Snippet.findByPk.mockResolvedValue(fakeSnippet);

            const req = mockReq({ params: { id: 1 }, user: 3 });
            const res = mockRes();

            await snippetController.deleteSnippet(req, res);

            expect(fakeSnippet.destroy).toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith({ msg: "Snippet deleted successfully" });
        });

        test("should return 403 if non-owner tries to delete", async () => {
            Snippet.findByPk.mockResolvedValue({ id: 1, userId: 5 });

            const req = mockReq({ params: { id: 1 }, user: 99 });
            const res = mockRes();

            await snippetController.deleteSnippet(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
        });

        test("should return 404 if snippet not found", async () => {
            Snippet.findByPk.mockResolvedValue(null);

            const req = mockReq({ params: { id: 999 }, user: 1 });
            const res = mockRes();

            await snippetController.deleteSnippet(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });
    });

    // ── Fork ──
    describe("forkSnippet", () => {
        test("should fork a public snippet and send notification email", async () => {
            const original = { id: 10, title: "Original", code: "x=1", language: "python", isPublic: true, userId: 5 };
            const forked = { id: 11, title: "Original", code: "x=1", language: "python", userId: 3, forkedFromId: 10 };
            Snippet.findByPk.mockResolvedValue(original);
            Snippet.create.mockResolvedValue(forked);
            User.findByPk
                .mockResolvedValueOnce({ id: 5, email: "owner@test.com", username: "owner" })  // owner
                .mockResolvedValueOnce({ id: 3, username: "forker" });                          // forker

            const req = mockReq({ params: { id: 10 }, user: 3 });
            const res = mockRes();

            await snippetController.forkSnippet(req, res);

            expect(Snippet.create).toHaveBeenCalledWith(
                expect.objectContaining({ forkedFromId: 10, userId: 3 })
            );
            expect(sendForkNotificationEmail).toHaveBeenCalledWith(
                "owner@test.com", "owner", "forker", "Original"
            );
            expect(res.json).toHaveBeenCalledWith(forked);
        });

        test("should NOT send email when forking own snippet", async () => {
            const original = { id: 10, title: "Mine", code: "x", language: "js", isPublic: true, userId: 3 };
            Snippet.findByPk.mockResolvedValue(original);
            Snippet.create.mockResolvedValue({ ...original, id: 11, forkedFromId: 10 });

            const req = mockReq({ params: { id: 10 }, user: 3 });
            const res = mockRes();

            await snippetController.forkSnippet(req, res);

            expect(sendForkNotificationEmail).not.toHaveBeenCalled();
            expect(res.json).toHaveBeenCalled();
        });

        test("should return 403 when forking a private snippet by non-owner", async () => {
            Snippet.findByPk.mockResolvedValue({ id: 1, isPublic: false, userId: 5 });

            const req = mockReq({ params: { id: 1 }, user: 99 });
            const res = mockRes();

            await snippetController.forkSnippet(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(Snippet.create).not.toHaveBeenCalled();
        });
    });
});


// ═══════════════════════════════════════════════
//  4. BCRYPT — Password Hashing
// ═══════════════════════════════════════════════
describe("Password Hashing (bcrypt)", () => {
    test("should hash a password correctly", async () => {
        const plain = "mysecurepassword";
        const hashed = await bcrypt.hash(plain, 10);

        expect(hashed).not.toBe(plain);
        expect(hashed.startsWith("$2")).toBe(true);
    });

    test("should verify a correct password", async () => {
        const plain = "testpass123";
        const hashed = await bcrypt.hash(plain, 10);

        const isMatch = await bcrypt.compare(plain, hashed);
        expect(isMatch).toBe(true);
    });

    test("should reject an incorrect password", async () => {
        const hashed = await bcrypt.hash("correctpass", 10);

        const isMatch = await bcrypt.compare("wrongpass", hashed);
        expect(isMatch).toBe(false);
    });
});


// ═══════════════════════════════════════════════
//  5. JWT — Token Generation & Verification
// ═══════════════════════════════════════════════
describe("JWT Token", () => {
    const SECRET = "unittestsecret";

    test("should generate a token with correct payload", () => {
        const token = jwt.sign({ id: 42 }, SECRET, { expiresIn: "1d" });
        const decoded = jwt.verify(token, SECRET);

        expect(decoded.id).toBe(42);
        expect(decoded).toHaveProperty("exp");
        expect(decoded).toHaveProperty("iat");
    });

    test("should throw on invalid secret", () => {
        const token = jwt.sign({ id: 1 }, SECRET);

        expect(() => jwt.verify(token, "wrongsecret")).toThrow();
    });

    test("should throw on expired token", () => {
        const token = jwt.sign({ id: 1 }, SECRET, { expiresIn: "0s" });

        expect(() => jwt.verify(token, SECRET)).toThrow();
    });
});
