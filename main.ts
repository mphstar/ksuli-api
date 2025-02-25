import "https://deno.land/x/dotenv@v3.2.2/load.ts";
import {
  Application,
  Context,
  Router,
} from "https://deno.land/x/oak@v17.1.4/mod.ts";
import { getXataClient } from "./src/xata.ts";
import { Next } from "https://deno.land/x/oak@v17.1.4/middleware.ts";
import { oakCors } from "https://deno.land/x/cors@v1.2.2/mod.ts"; // 🔹 Import CORS middleware

const router = new Router();
const xata = getXataClient();

// Middleware untuk mengecek Bearer Token
const authMiddleware = async (ctx: Context, next: Next) => {
  const authHeader = ctx.request.headers.get("Authorization");

  if (!authHeader || authHeader !== "Bearer KSULI_TOKEN_321") {
    ctx.response.status = 401;
    ctx.response.body = { error: "Unauthorized" };
    return;
  }

  await next();
};

router.get("/", (ctx) => {
  ctx.response.body = { message: "Hello, This K-Suli" };
});

router.post("/proses-kuis", authMiddleware, async (ctx) => {
  const body = await ctx.request.body.json();

  if (!body.kategori_id || !body.person_name || !body.score) {
    ctx.response.status = 400;
    ctx.response.body = { error: "Bad Request" };
    return;
  }

  try {
    const res = await xata.db.kuis.create({
      kategori_id: body.kategori_id,
      person_name: body.person_name,
      score: body.score,
    });

    ctx.response.body = {
      message: "Kuis berhasil disimpan",
      data: res,
    };
    // deno-lint-ignore no-unused-vars
  } catch (error) {
    ctx.response.status = 500;
    ctx.response.body = { error: "Internal Server Error" };
  }
});

const app = new Application();

// Gunakan middleware sebelum routes
app.use(
  oakCors({
    origin: "*", // Bisa diganti dengan "http://localhost:5173" jika hanya ingin membolehkan localhost
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // Izinkan metode HTTP tertentu
    allowedHeaders: ["Content-Type", "Authorization"], // Izinkan header tertentu
  })
);
app.use(router.routes());
app.use(router.allowedMethods());

console.log("Server running on http://localhost:8000");
await app.listen({ port: 8000 });
