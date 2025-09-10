import { Sequelize } from "sequelize";

const sequelize = new Sequelize({
  dialect: process.env.DATABASE_DIALECT,
  host: process.env.DATABASE_HOST,
  port: process.env.DATABASE_PORT,
  database: process.env.DATABASE_NAME,
  username: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  logging: false,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
});

export async function initDb() {
  try {
    await sequelize.authenticate();
    console.log("Database connection successful");
    await import("./User.js");
    await import("./Contact.js");
    await import("./associations.js");
  await sequelize.sync({ alter: true }); 
  
    console.log("Models synchronized");
  } catch (error) {
    console.error("Unable to connect to the database:", error.message);
    process.exit(1);
  }
}
export default sequelize;
