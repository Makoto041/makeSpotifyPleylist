// src/main.ts
import { Hono } from "hono";
import { handle } from "hono/vercel";
import auth from "./auth";
import upload from "./upload";

const app = new Hono().basePath("/api");

app.route("/auth", auth);
app.route("/upload", upload);

app.get("/", (c) => c.text("APIルートです"));
app.get("/ping", (c) => c.text("pong"));

export const GET = handle(app);
export const POST = handle(app);
export default handle(app);
