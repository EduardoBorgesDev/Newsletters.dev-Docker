import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bd from "./src/models/index.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { createClient as createRedisClient } from "redis";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

// Inicializa app e dependências primeiro
const app = express();
const port = 3000;
app.use(express.json());
app.use(cors());

// Supabase Client (inclui Storage)
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const { Task, User, Newsletter } = bd;
// Listagem de newsletters com cache Redis
app.get("/newsletters", async (req, res) => {
  try {
    const cacheKey = "newsletters:list";
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      return res.json({ cache: "hit", data: JSON.parse(cached) });
    }
    const newsletters = await Newsletter.findAll();
    await redisClient.set(cacheKey, JSON.stringify(newsletters), { EX: 60 });
    res.json({ cache: "miss", data: newsletters });
  } catch (err) {
    res.status(500).json({ error: "Erro ao buscar newsletters" });
  }
});

// Criar newsletter
app.post("/newsletters", authMiddleware, async (req, res) => {
  const { title, description, image_url } = req.body;
  if (!title || !description) return res.status(400).json({ error: "Campos obrigatórios" });
  const newsletter = await Newsletter.create({ title, description, image_url, author_id: req.userId });
  await redisClient.del("newsletters:list");
  res.status(201).json(newsletter);
});

// Editar newsletter
app.put("/newsletters/:id", authMiddleware, async (req, res) => {
  const { title, description, image_url } = req.body;
  const newsletter = await Newsletter.findByPk(req.params.id);
  if (!newsletter) return res.status(404).json({ error: "Newsletter não encontrada" });
  if (newsletter.author_id !== req.userId) return res.status(403).json({ error: "Acesso negado" });
  await newsletter.update({ title, description, image_url });
  await redisClient.del("newsletters:list");
  res.json(newsletter);
});

// Excluir newsletter
app.delete("/newsletters/:id", authMiddleware, async (req, res) => {
  const newsletter = await Newsletter.findByPk(req.params.id);
  if (!newsletter) return res.status(404).json({ error: "Newsletter não encontrada" });
  if (newsletter.author_id !== req.userId) return res.status(403).json({ error: "Acesso negado" });
  await newsletter.destroy();
  await redisClient.del("newsletters:list");
  res.status(204).send();
});
// Middleware de autenticação JWT
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "Token não fornecido" });
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ error: "Token inválido" });
    req.userId = decoded.id;
    next();
  });
}
// Registro de usuário
app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: "Campos obrigatórios" });
  const existing = await User.findOne({ where: { email } });
  if (existing) return res.status(409).json({ error: "E-mail já cadastrado" });
  const hash = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, password: hash });
  res.status(201).json({ id: user.id, name: user.name, email: user.email });
});

// Login de usuário
app.post("/signin", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Campos obrigatórios" });
  const user = await User.findOne({ where: { email } });
  if (!user) return res.status(401).json({ error: "Usuário ou senha inválidos" });
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: "Usuário ou senha inválidos" });
  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "7d" });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, avatar_url: user.avatar_url } });
});

// Rota protegida de perfil
app.get("/profile", authMiddleware, async (req, res) => {
  const user = await User.findByPk(req.userId);
  if (!user) return res.status(404).json({ error: "Usuário não encontrado" });
  res.json({ id: user.id, name: user.name, email: user.email, avatar_url: user.avatar_url });
});

// Testa a conexão com o banco de dados
try {
  await bd.sequelize.authenticate();
  console.log("Conexão com o banco de dados estabelecida com sucesso.");
} catch (error) {
  console.error("Erro ao conectar ao banco de dados:", error);
  process.exit(1);
}

// app já inicializado acima

// Configuração do Redis
const redisClient = createRedisClient({ url: process.env.REDIS_URL });
redisClient.connect().catch(console.error);

// Reenvio de e-mail de confirmação com cooldown via Redis
app.post("/auth/resend-confirmation", async (req, res) => {
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ error: "E-mail é obrigatório" });
  try {
    const user = await User.findOne({ where: { email } });
    // Não revelar existência do usuário
    if (!user) return res.json({ message: "Se o e-mail existir, enviaremos instruções." });

    const key = `resend:${email}`;
    const ttl = await redisClient.ttl(key);
    if (ttl > 0) {
      return res.status(429).json({ error: `Aguarde ${ttl}s para reenviar`, retryAfter: ttl });
    }

    // Define cooldown de 60s
    await redisClient.set(key, "1", { EX: 60 });

    const token = jwt.sign({ id: user.id, purpose: "email-confirm" }, process.env.JWT_SECRET, { expiresIn: "1h" });
    const verifyUrl = `${process.env.APP_BASE_URL || "http://localhost"}/verify-email?token=${token}`;

    // Aqui você enviaria o e-mail de confirmação (SMTP/provider). Por ora retornamos o link.
    return res.json({ message: "E-mail de confirmação reenviado", verifyUrl, cooldown: 60 });
  } catch (err) {
    return res.status(500).json({ error: "Falha ao reenviar confirmação" });
  }
});

app.get("/", (req, res) => {
  res.json({ message: "Hello World" });
});

// Listagem de tasks com cache Redis
app.get("/tasks", async (req, res) => {
  try {
    const cacheKey = "tasks:list";
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      return res.json({ cache: "hit", data: JSON.parse(cached) });
    }
    const tasks = await Task.findAll();
    await redisClient.set(cacheKey, JSON.stringify(tasks), { EX: 60 }); // cache 1 min
    res.json({ cache: "miss", data: tasks });
  } catch (err) {
    res.status(500).json({ error: "Erro ao buscar tasks" });
  }
});

app.post("/tasks", async (req, res) => {
  const { description } = req.body;
  if (!description) return res.status(400).json({ error: "Descrição obrigatória" });
  const task = await Task.create({ description, completed: false });
  await redisClient.del("tasks:list"); // Invalida cache
  res.status(201).json(task);
});

app.get("/tasks/:id", async (req, res) => {
  const task = await Task.findByPk(req.params.id);
  if (!task) return res.status(404).json({ error: "Tarefa não encontrada" });
  res.json(task);
});

app.put("/tasks/:id", async (req, res) => {
  const { description, completed } = req.body;
  const task = await Task.findByPk(req.params.id);
  if (!task) return res.status(404).json({ error: "Tarefa não encontrada" });
  await task.update({ description, completed });
  await redisClient.del("tasks:list"); // Invalida cache
  res.json(task);
});

app.delete("/tasks/:id", async (req, res) => {
  const deleted = await Task.destroy({ where: { id: req.params.id } });
  if (!deleted) return res.status(404).json({ error: "Tarefa não encontrada" });
  await redisClient.del("tasks:list"); // Invalida cache
  res.status(204).send();
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server is running on port ${port}`);
  console.log(`Database is running on port ${process.env.DB_PORT}`);
});
//att