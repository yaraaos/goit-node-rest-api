import express from "express";
import morgan from "morgan";
import cors from "cors";
import "dotenv/config";
import { initDb } from "./db/sequelize.js";  
import contactsRouter from "./routes/contactsRouter.js";

const app = express();

app.use(morgan("tiny"));
app.use(cors());
app.use(express.json());

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
  // Try to connect to DB first; exit(1) on failure (handled inside initDb)
  await initDb(); // prints "Database connection successful" on success

  app.listen(port, () => {
    console.log(`Server is running. Use our API on port: ${port}`);
  });
})();