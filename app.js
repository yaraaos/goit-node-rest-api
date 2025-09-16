import express from "express";
import morgan from "morgan";
import cors from "cors";
import "dotenv/config";
import { initDb } from "./db/sequelize.js";  
import contactsRouter from "./routes/contactsRouter.js";
import authRouter from "./routes/authRouter.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(morgan("tiny"));
app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, "public")));

app.use("/api/auth", authRouter);
app.use("/api/contacts", contactsRouter);

app.use((_, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use((err, req, res, next) => {
  const { status = 500, message = "Server error" } = err;
  res.status(status).json({ message });
});

const port = process.env.PORT || 3000;

(async () => {

  await initDb(); 

  app.listen(port, () => {
    console.log(`Server is running. Use our API on port: ${port}`);
  });
})();