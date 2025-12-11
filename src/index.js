import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { User } from "./user.js";

const app = express();
dotenv.config();
const conDb = () => {
  const {
    MONGO_USERNAME,
    MONGO_PASSWORD,
    MONGO_PORT,
    MONGO_DB,
    MONGO_HOSTNAME,
  } = process.env;
  const url = `mongodb://${MONGO_USERNAME}:${MONGO_PASSWORD}@${MONGO_HOSTNAME}:${MONGO_PORT}/${MONGO_DB}?authSource=admin`;
  mongoose
    .connect(url)
    .then(function () {
      console.log("[+] Conexion con bd exitosa!");
    })
    .catch((err) => console.log(`[-] ${err}`));
};

const port = 3005;
app.use(cors({ origin: "*" })); // cors
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: false }));

app.listen(port, function () {
  conDb();
  console.log(`[+] Api corriendo en http://localhost:${port}!`);
});
app.get("/usuarios", async (req, res) => {
  console.log("[+] Nueva peticion: GET /usuarios");
  try {
    let usuarios = await User.find().exec();
    res.status(200).send({
      success: true,
      message: "Se encontraron los usuarios",
      outcome: [usuarios],
    });
  } catch {
    res.status(400).send({
      success: false,
      message: "Error al intentar obtener los usuarios",
      outcome: [],
    });
  }
});

app.post("/usuarios", async (req, res) => {
  console.log(`[+] Nueva peticion: POST /`);
  try {
    let data = req.body;
    let newUser = new User(data);
    await newUser.save();
    res
      .status(200)
      .send({ success: true, message: "Usuario registrado", outcome: [] });
  } catch (err) {
    res.status(400).send({
      success: false,
      message: "No se pudo registrar al usuario, intente de nuevo",
      outcome: [],
    });
  }
});
app.patch("/usuarios", async (req, res) => {
  console.log(`[+] Nueva peticion: PATCH /usuarios`);
  const keys = ["name", "lastName", "username", "role", "password"];
  try {
    let data = req.body;

    if (!("_id" in data) || data._id === "") throw new Error("Falta el _id");
    let u = await User.findById(data._id);
    if (!u)
      return res.status(404).send({
        success: false,
        message: "Usuario no encontrado",
      });
    const dataKeys = Object.keys(data);
    if (dataKeys.some((k) => (k == "_id" ? false : !keys.includes(k))))
      throw new Error(`Atributos invalidos`);
    if (data.name) u.name = data.name;
    if (data.lastName) u.lastName = data.lastName;
    if (data.username) u.username = data.username;
    if (data.password) u.password = data.password;
    if (data.role) u.role = data.role;
    await u.save();

    res
      .status(200)
      .send({ success: true, message: "Usuario editado", outcome: [u] });
  } catch (err) {
    res.status(400).send({
      success: false,
      message: err.message || "No se pudo editar al usuario, intente de nuevo",
      outcome: [],
    });
  }
});