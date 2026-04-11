import axios from "axios";
import app from "../app";
import redis from "../utils/redis";
import { Server } from "http";

let server: Server;
let baseURL: string;

beforeAll(async () => {
  await new Promise<void>((resolve) => {
    server = app.listen(0, () => {
      const addr = server.address();
      let portNum = 0;
      if (addr && typeof addr === "object" && "port" in addr) {
        // AddressInfo case
        // @ts-ignore - runtime object from Node has port
        portNum = (addr as any).port;
      } else if (typeof addr === "string") {
        const parsed = parseInt(addr.split(":").pop() || "0", 10);
        portNum = Number.isNaN(parsed) ? 0 : parsed;
      }
      baseURL = `http://127.0.0.1:${portNum}`;
      resolve();
    });
  });
});

afterAll(async () => {
  await new Promise<void>((resolve) => {
    server.close(() => {
      // Close redis connection used by middleware to avoid open handles
      try {
        redis.disconnect();
      } catch (err) {
        // ignore
      }
      resolve();
    });
  });
});

test("GET / returns health information", async () => {
  const res = await axios.get(`${baseURL}/`);
  expect(res.status).toBe(200);
  expect(res.data).toHaveProperty("message");
  expect(res.data).toHaveProperty("status", "Active");
  expect(res.data).toHaveProperty("database");
});
