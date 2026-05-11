/**
 * ============================================
 *  INTEGRATION TESTS — Code Snippet Platform
 * ============================================
 *  Tests full API endpoints with real HTTP requests
 *  using an in-memory SQLite database.
 *
 *  Run:  npm run test:integration
 * ============================================
 */

require("dotenv").config();

const request = require("supertest");
const { Sequelize } = require("sequelize");

// Override the database config BEFORE importing models — use in-memory SQLite
jest.mock("../config/database", () => {
    const { Sequelize } = require("sequelize");
    return new Sequelize({
        dialect: "sqlite",
        storage: ":memory:",
        logging: false,
    });
});

// Mock the mailer so no real emails are sent during tests
jest.mock("../utils/mailer", () => ({
    sendWelcomeEmail: jest.fn(),
    sendForkNotificationEmail: jest.fn(),
}));

const app = require("../app");
const sequelize = require("../config/database");
const User = require("../models/User");
const Snippet = require("../models/Snippet");
const { sendWelcomeEmail, sendForkNotificationEmail } = require("../utils/mailer");


// ─── Test State ──────────────────────────────────────
let authToken = "";
let secondAuthToken = "";
let createdSnippetId = null;


// ─── Setup & Teardown ────────────────────────────────
beforeAll(async () => {
    // Sync all models to in-memory DB
    await sequelize.sync({ force: true });
});

afterAll(async () => {
    await sequelize.close();
});

beforeEach(() => {
    jest.clearAllMocks();
});


// ═══════════════════════════════════════════════
//  1. HEALTH CHECK
// ═══════════════════════════════════════════════
describe("GET /", () => {
    test("should return server status message", async () => {
        const res = await request(app).get("/");

        expect(res.status).toBe(200);
        expect(res.text).toContain("Server is running");
    });
});


// ═══════════════════════════════════════════════
//  2. AUTHENTICATION FLOW
// ═══════════════════════════════════════════════
describe("Auth — /api/auth", () => {

    // ── Register ──
    describe("POST /api/auth/register", () => {
        test("should register a new user successfully", async () => {
            const res = await request(app)
                .post("/api/auth/register")
                .send({ username: "testuser", email: "test@example.com", password: "password123" });

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty("id");
            expect(res.body.username).toBe("testuser");
            expect(res.body.email).toBe("test@example.com");
            // Password should be hashed, not plaintext
            expect(res.body.password).not.toBe("password123");
        });

        test("should trigger welcome email on registration", async () => {
            const res = await request(app)
                .post("/api/auth/register")
                .send({ username: "emailuser", email: "email@example.com", password: "pass123" });

            expect(res.status).toBe(200);
            expect(sendWelcomeEmail).toHaveBeenCalledWith("email@example.com", "emailuser");
        });

        test("should fail when registering with duplicate email", async () => {
            const res = await request(app)
                .post("/api/auth/register")
                .send({ username: "dupe", email: "test@example.com", password: "pass123" });

            expect(res.status).toBe(500);
            expect(res.body).toHaveProperty("error");
        });

        test("should register a second user for later tests", async () => {
            const res = await request(app)
                .post("/api/auth/register")
                .send({ username: "seconduser", email: "second@example.com", password: "pass456" });

            expect(res.status).toBe(200);
            expect(res.body.username).toBe("seconduser");
        });
    });

    // ── Login ──
    describe("POST /api/auth/login", () => {
        test("should login and return a JWT token", async () => {
            const res = await request(app)
                .post("/api/auth/login")
                .send({ email: "test@example.com", password: "password123" });

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty("token");
            expect(typeof res.body.token).toBe("string");

            // Save token for later tests
            authToken = res.body.token;
        });

        test("should login second user", async () => {
            const res = await request(app)
                .post("/api/auth/login")
                .send({ email: "second@example.com", password: "pass456" });

            expect(res.status).toBe(200);
            secondAuthToken = res.body.token;
        });

        test("should fail with wrong password", async () => {
            const res = await request(app)
                .post("/api/auth/login")
                .send({ email: "test@example.com", password: "wrongpassword" });

            expect(res.status).toBe(400);
            expect(res.body.msg).toBe("Invalid credentials");
        });

        test("should fail with non-existent email", async () => {
            const res = await request(app)
                .post("/api/auth/login")
                .send({ email: "nobody@example.com", password: "pass" });

            expect(res.status).toBe(400);
            expect(res.body.msg).toBe("User not found");
        });
    });
});


// ═══════════════════════════════════════════════
//  3. SNIPPET CRUD
// ═══════════════════════════════════════════════
describe("Snippets — /api/snippets", () => {

    // ── Create ──
    describe("POST /api/snippets/ (Create)", () => {
        test("should create a public snippet", async () => {
            const res = await request(app)
                .post("/api/snippets/")
                .set("Authorization", `Bearer ${authToken}`)
                .send({
                    title: "Hello World",
                    code: "console.log('Hello');",
                    language: "javascript",
                    isPublic: true,
                });

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty("id");
            expect(res.body.title).toBe("Hello World");
            expect(res.body.language).toBe("javascript");
            expect(res.body.isPublic).toBe(true);

            createdSnippetId = res.body.id;
        });

        test("should create a private snippet", async () => {
            const res = await request(app)
                .post("/api/snippets/")
                .set("Authorization", `Bearer ${authToken}`)
                .send({
                    title: "Private Snippet",
                    code: "secret_key = '123'",
                    language: "python",
                    isPublic: false,
                });

            expect(res.status).toBe(200);
            expect(res.body.isPublic).toBe(false);
        });

        test("should fail without auth token", async () => {
            const res = await request(app)
                .post("/api/snippets/")
                .send({ title: "No Auth", code: "x", language: "js" });

            expect(res.status).toBe(401);
        });
    });

    // ── Get Public ──
    describe("GET /api/snippets/ (Public Feed)", () => {
        test("should return only public snippets", async () => {
            const res = await request(app).get("/api/snippets/");

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);

            // All returned snippets should be public
            res.body.forEach((snippet) => {
                expect(snippet.isPublic).toBe(true);
            });
        });

        test("should include the user's username in response", async () => {
            const res = await request(app).get("/api/snippets/");

            expect(res.status).toBe(200);
            if (res.body.length > 0) {
                expect(res.body[0]).toHaveProperty("User");
                expect(res.body[0].User).toHaveProperty("username");
            }
        });
    });

    // ── Get My Snippets ──
    describe("GET /api/snippets/mine (My Snippets)", () => {
        test("should return only the logged-in user's snippets", async () => {
            const res = await request(app)
                .get("/api/snippets/mine")
                .set("Authorization", `Bearer ${authToken}`);

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBeGreaterThanOrEqual(2); // public + private
        });

        test("should fail without auth", async () => {
            const res = await request(app).get("/api/snippets/mine");

            expect(res.status).toBe(401);
        });
    });

    // ── Get by ID ──
    describe("GET /api/snippets/:id (By ID)", () => {
        test("should return a public snippet by ID", async () => {
            const res = await request(app).get(`/api/snippets/${createdSnippetId}`);

            expect(res.status).toBe(200);
            expect(res.body.id).toBe(createdSnippetId);
            expect(res.body.title).toBe("Hello World");
        });

        test("should return 404 for non-existent snippet", async () => {
            const res = await request(app).get("/api/snippets/99999");

            expect(res.status).toBe(404);
        });
    });

    // ── Update ──
    describe("PUT /api/snippets/:id (Update)", () => {
        test("should update the snippet title and code", async () => {
            const res = await request(app)
                .put(`/api/snippets/${createdSnippetId}`)
                .set("Authorization", `Bearer ${authToken}`)
                .send({ title: "Updated Title", code: "console.log('Updated');" });

            expect(res.status).toBe(200);
            expect(res.body.title).toBe("Updated Title");
            expect(res.body.code).toBe("console.log('Updated');");
        });

        test("should fail when non-owner tries to update", async () => {
            const res = await request(app)
                .put(`/api/snippets/${createdSnippetId}`)
                .set("Authorization", `Bearer ${secondAuthToken}`)
                .send({ title: "Hacked" });

            expect(res.status).toBe(403);
        });

        test("should fail without auth", async () => {
            const res = await request(app)
                .put(`/api/snippets/${createdSnippetId}`)
                .send({ title: "No Auth" });

            expect(res.status).toBe(401);
        });
    });

    // ── Fork ──
    describe("POST /api/snippets/fork/:id (Fork)", () => {
        test("should fork a public snippet and notify the owner via email", async () => {
            const res = await request(app)
                .post(`/api/snippets/fork/${createdSnippetId}`)
                .set("Authorization", `Bearer ${secondAuthToken}`);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty("id");
            expect(res.body.forkedFromId).toBe(createdSnippetId);
            expect(res.body.title).toBe("Updated Title"); // copied from original

            // Verify fork notification email was triggered
            expect(sendForkNotificationEmail).toHaveBeenCalledTimes(1);
            expect(sendForkNotificationEmail).toHaveBeenCalledWith(
                "test@example.com",     // owner email
                "testuser",             // owner username
                "seconduser",           // forker username
                "Updated Title"         // snippet title
            );
        });

        test("should fail without auth", async () => {
            const res = await request(app)
                .post(`/api/snippets/fork/${createdSnippetId}`);

            expect(res.status).toBe(401);
        });

        test("should return 404 for non-existent snippet", async () => {
            const res = await request(app)
                .post("/api/snippets/fork/99999")
                .set("Authorization", `Bearer ${authToken}`);

            expect(res.status).toBe(404);
        });
    });

    // ── Delete ──
    describe("DELETE /api/snippets/:id (Delete)", () => {
        test("should fail when non-owner tries to delete", async () => {
            const res = await request(app)
                .delete(`/api/snippets/${createdSnippetId}`)
                .set("Authorization", `Bearer ${secondAuthToken}`);

            expect(res.status).toBe(403);
        });

        test("should delete the snippet if owner", async () => {
            const res = await request(app)
                .delete(`/api/snippets/${createdSnippetId}`)
                .set("Authorization", `Bearer ${authToken}`);

            expect(res.status).toBe(200);
            expect(res.body.msg).toBe("Snippet deleted successfully");
        });

        test("should confirm snippet is gone after deletion", async () => {
            const res = await request(app).get(`/api/snippets/${createdSnippetId}`);

            expect(res.status).toBe(404);
        });

        test("should fail without auth", async () => {
            const res = await request(app)
                .delete(`/api/snippets/${createdSnippetId}`);

            expect(res.status).toBe(401);
        });
    });
});
