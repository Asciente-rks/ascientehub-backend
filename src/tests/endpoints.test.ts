// Comprehensive smoke tests for public and authenticated endpoints.
// Mocks services to avoid external DB/Redis dependencies.

// Mock Redis so rate-limiter doesn't connect
jest.mock("../utils/redis", () => ({
  default: {
    incr: jest.fn().mockResolvedValue(1),
    expire: jest.fn().mockResolvedValue(1),
    ttl: jest.fn().mockResolvedValue(60),
    disconnect: jest.fn(),
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue("OK"),
  },
}));

// Bypass auth middleware and inject a test user
jest.mock("../middlewares/auth.middleware", () => ({
  authenticateToken: (req: any, res: any, next: any) => {
    req.user = { id: "test-user", roleId: "role-test", roleName: "tester" };
    next();
  },
}));

// Mock services with simple deterministic responses
jest.mock("../services/auth.service", () => ({
  AuthService: jest.fn().mockImplementation(() => ({
    register: async (body: any) => ({ id: "u1", status: "active", ...body }),
    verifyOtp: async (email: string, code: string) => ({
      id: "u1",
      roleId: "buyer",
      status: "active",
    }),
    login: async () => ({
      user: { id: "u1", name: "Test User" },
      token: "jwt-token",
    }),
    forgotPassword: async () => {},
    resetPassword: async () => {},
  })),
}));

jest.mock("../services/game.service", () => ({
  GameService: jest.fn().mockImplementation(() => ({
    getGames: async () => [{ id: "game1", title: "Game One" }],
    getGameById: async (id: string) => ({ id, title: `Game ${id}` }),
    createGame: async () => ({ id: "new-game" }),
  })),
}));

jest.mock("../services/meta.service", () => ({
  MetaService: jest.fn().mockImplementation(() => ({
    getPublicRegistrationData: async () => ({ roles: [], categories: [] }),
  })),
}));

jest.mock("../services/user.service", () => ({
  UserService: jest.fn().mockImplementation(() => ({
    getUserProfile: async (id: string) => ({ id, name: "Test User" }),
    changePassword: async () => {},
    requestDeletion: async () => {},
    confirmDeletion: async () => {},
    getLibrary: async () => [],
    getPurchaseHistory: async () => [],
    updateProfile: async (id: string, data: any) => ({ id, ...data }),
    applyForDeveloper: async () => ({ applied: true }),
  })),
}));

jest.mock("../services/cart.service", () => ({
  CartService: jest.fn().mockImplementation(() => ({
    addToCart: async () => ({ items: [] }),
    getCart: async () => ({ items: [] }),
    removeFromCart: async () => {},
    clearCart: async () => {},
  })),
}));

jest.mock("../services/review.service", () => ({
  ReviewService: jest.fn().mockImplementation(() => ({
    addReview: async () => ({ id: "r1" }),
    getGameReviews: async () => [],
    deleteReview: async () => {},
  })),
}));

jest.mock("../services/admin.service", () => ({
  AdminService: jest.fn().mockImplementation(() => ({
    getDeveloperApplications: async () => [],
    reviewDeveloperApplication: async () => ({ ok: true }),
    getUserPurchases: async () => [],
    getPendingGames: async () => [],
    reviewGame: async () => ({ ok: true }),
  })),
}));

jest.mock("../services/payment.service", () => ({
  PaymentService: jest.fn().mockImplementation(() => ({
    createPaymentMethod: async (data: any) => ({
      id: "pm1",
      attributes: {
        type: "card",
        details: { brand: "visa", last4: "4242", exp_month: 1, exp_year: 2030 },
      },
    }),
    createPaymentIntent: async () => ({
      id: "pi1",
      attributes: { status: "succeeded", amount: 100 },
    }),
    attachAndConfirmPayment: async () => ({
      id: "pay1",
      attributes: { status: "succeeded", amount: 100 },
    }),
    getPaymentIntent: async (id: string) => ({
      id,
      attributes: { status: "succeeded", amount: 100 },
    }),
  })),
}));

jest.mock("../services/paymentMethod.service", () => ({
  PaymentMethodService: jest.fn().mockImplementation(() => ({
    savePaymentMethod: async () => ({ id: "saved1" }),
    listPaymentMethods: async () => [
      { id: "m1", isDefault: true, paymongoId: "pm1" },
    ],
    deletePaymentMethod: async () => true,
    setDefaultPaymentMethod: async () => true,
  })),
}));

jest.mock("../services/transaction.service", () => ({
  TransactionService: jest.fn().mockImplementation(() => ({
    getGameForPurchase: async (id: string) => ({
      id,
      title: "Game",
      basePrice: 100,
    }),
    checkGameOwnership: async () => false,
    createTransaction: async () => ({ id: "tx1" }),
  })),
}));

// Mock upload middleware to avoid multer during tests (provide thumbnail)
jest.mock("../middlewares/upload.middleware", () => ({
  upload: {
    fields: () => (req: any, res: any, next: any) => {
      req.files = {
        thumbnail: [
          {
            buffer: Buffer.from("thumb"),
            originalname: "thumb.png",
            mimetype: "image/png",
          },
        ],
        trailer: [],
      };
      next();
    },
  },
}));

// Bypass validation middleware for tests
jest.mock("../middlewares/validator.middleware", () => ({
  validate: () => (req: any, res: any, next: any) => next(),
}));

// Mock DeveloperService
jest.mock("../services/developer.service", () => ({
  DeveloperService: jest.fn().mockImplementation(() => ({
    getMyGames: async (devId: string) => [
      { id: "devgame1", title: "Dev Game" },
    ],
    editGame: async () => ({ id: "edited" }),
    deleteGame: async () => {},
    getGameAnalytics: async () => ({ plays: 123 }),
  })),
}));

// Now import app after mocks
import app from "../app";
const request = require("supertest");

describe("API endpoints smoke tests", () => {
  it("GET / should return health", async () => {
    const res = await request(app).get("/");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("message");
  });

  it("GET /api/public/registration-data", async () => {
    const res = await request(app).get("/api/public/registration-data");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("roles");
  });

  it("POST /api/auth/register", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "a@b.com", password: "pass" });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("userId");
  });

  it("POST /api/auth/login", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "a@b.com", password: "pass" });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");
  });

  it("GET /api/games", async () => {
    const res = await request(app).get("/api/games");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("GET /api/games/:id", async () => {
    const res = await request(app).get("/api/games/game1");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("id", "game1");
  });

  it("GET /api/admin/developers/pending", async () => {
    const res = await request(app).get("/api/admin/developers/pending");
    expect(res.status).toBe(200);
  });

  it("POST /api/reviews (authenticated)", async () => {
    const res = await request(app)
      .post("/api/reviews")
      .send({ gameId: "game1", rating: 5, comment: "Nice" });
    expect(res.status).toBe(201);
  });

  it("POST /api/cart (authenticated)", async () => {
    const res = await request(app).post("/api/cart").send({ gameId: "game1" });
    expect(res.status).toBe(201);
  });

  it("GET /api/users/profile (authenticated)", async () => {
    const res = await request(app).get("/api/users/profile");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("id");
  });

  it("GET /api/payments/methods (authenticated)", async () => {
    const res = await request(app).get("/api/payments/methods");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("paymentMethods");
  });

  it("POST /api/payments/webhook should return 200", async () => {
    const res = await request(app)
      .post("/api/payments/webhook")
      .send({ data: { id: "p1", attributes: { status: "paid" } } });
    expect(res.status).toBe(200);
  });

  // --- Additional tests for uncovered endpoints ---
  it("POST /api/auth/verify-otp", async () => {
    const res = await request(app)
      .post("/api/auth/verify-otp")
      .send({ email: "a@b.com", code: "1234" });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("status");
  });

  it("POST /api/auth/forgot-password and /reset-password", async () => {
    const forgot = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: "a@b.com" });
    expect(forgot.status).toBe(200);

    const reset = await request(app)
      .post("/api/auth/reset-password")
      .send({ email: "a@b.com", code: "code", newPassword: "newpass" });
    expect(reset.status).toBe(200);
  });

  it("POST /api/auth/logout", async () => {
    const res = await request(app).post("/api/auth/logout");
    expect(res.status).toBe(200);
  });

  // User routes
  it("PATCH /api/users/profile", async () => {
    const res = await request(app)
      .patch("/api/users/profile")
      .send({ username: "newname", avatarUrl: "http://a" });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("message");
  });

  it("PUT /api/users/change-password", async () => {
    const res = await request(app)
      .put("/api/users/change-password")
      .send({ oldPass: "a", newPass: "b" });
    expect(res.status).toBe(200);
  });

  it("POST /api/users/request-deletion and DELETE /api/users/confirm-deletion", async () => {
    const req = await request(app).post("/api/users/request-deletion");
    expect(req.status).toBe(200);

    const conf = await request(app)
      .delete("/api/users/confirm-deletion")
      .send({ code: "1234" });
    expect(conf.status).toBe(200);
  });

  it("GET /api/users/library and /api/users/purchase-history", async () => {
    const lib = await request(app).get("/api/users/library");
    expect(lib.status).toBe(200);
    expect(Array.isArray(lib.body)).toBe(true);

    const ph = await request(app).get("/api/users/purchase-history");
    expect(ph.status).toBe(200);
  });

  it("POST /api/users/apply-developer", async () => {
    const res = await request(app).post("/api/users/apply-developer");
    expect(res.status).toBe(200);
  });

  // Admin routes
  it("PATCH /api/admin/review-developer/:userId", async () => {
    const res = await request(app)
      .patch("/api/admin/review-developer/u1")
      .send({ action: "approve" });
    expect(res.status).toBe(200);
  });

  it("GET /api/admin/users/:userId/purchases", async () => {
    const res = await request(app).get("/api/admin/users/u1/purchases");
    expect(res.status).toBe(200);
  });

  it("GET /api/admin/games/pending and PATCH /api/admin/games/:gameId/review", async () => {
    const list = await request(app).get("/api/admin/games/pending");
    expect(list.status).toBe(200);

    const rev = await request(app)
      .patch("/api/admin/games/g1/review")
      .send({ action: "approve" });
    expect(rev.status).toBe(200);
  });

  // Cart endpoints
  it("GET /api/cart, DELETE /api/cart/:gameId and DELETE /api/cart", async () => {
    const g = await request(app).get("/api/cart");
    expect(g.status).toBe(200);

    const del = await request(app).delete("/api/cart/game1");
    expect(del.status).toBe(200);

    const clear = await request(app).delete("/api/cart");
    expect(clear.status).toBe(200);
  });

  // Review endpoints
  it("GET /api/reviews/game/:gameId and DELETE /api/reviews/:reviewId", async () => {
    const get = await request(app).get("/api/reviews/game/game1");
    expect(get.status).toBe(200);

    const del = await request(app).delete("/api/reviews/r1");
    expect(del.status).toBe(200);
  });

  // Developer & game routes
  it("GET /api/developer/games and /api/games/dev/my-games", async () => {
    const d1 = await request(app).get("/api/developer/games");
    expect(d1.status).toBe(200);

    const d2 = await request(app).get("/api/games/dev/my-games");
    expect(d2.status).toBe(200);
  });

  it("PATCH/DELETE developer game and GET analytics", async () => {
    const p = await request(app)
      .patch("/api/developer/games/g1")
      .send({ title: "x" });
    expect(p.status).toBe(200);

    const d = await request(app).delete("/api/developer/games/g1");
    expect(d.status).toBe(200);

    const a = await request(app).get("/api/developer/games/g1/analytics");
    expect(a.status).toBe(200);
  });

  it("POST /api/games (createGame) - multipart bypassed by mocked upload", async () => {
    const res = await request(app)
      .post("/api/games")
      .field("title", "T")
      .field("description", "D")
      .field("price", "10")
      .field("categoryId", "c1");
    // Controller returns 201 when created
    expect([200, 201]).toContain(res.status);
  });

  // Payment flows
  it("POST /api/payments/sources and POST /api/payments and POST /api/payments/complete", async () => {
    const src = await request(app)
      .post("/api/payments/sources")
      .send({
        cardNumber: "4242 4242 4242 4242",
        expMonth: "1",
        expYear: "2030",
        cvc: "123",
      });
    expect(src.status).toBe(200);

    const create = await request(app)
      .post("/api/payments")
      .send({ gameId: "game1" });
    expect([200, 400]).toContain(create.status);

    const complete = await request(app)
      .post("/api/payments/complete")
      .send({ paymentId: "pi1", gameId: "game1" });
    expect([200, 400]).toContain(complete.status);
  });

  it("PUT/DELETE payment methods and GET payment status", async () => {
    const put = await request(app).put("/api/payments/methods/m1/default");
    expect(put.status).toBe(200);

    const del = await request(app).delete("/api/payments/methods/m1");
    expect(del.status).toBe(200);

    const st = await request(app).get("/api/payments/pi1");
    expect(st.status).toBe(200);
  });
});
