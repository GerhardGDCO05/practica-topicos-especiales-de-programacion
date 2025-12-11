import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { User } from "./user.js";

const app = express();
dotenv.config();
const connectDB = () => {
  const {
    MONGO_USERNAME,
    MONGO_PASSWORD,
    MONGO_PORT,
    MONGO_DB,
    MONGO_HOSTNAME,
  } = process.env;
  const url = `mongodb://${MONGO_USERNAME}:${MONGO_PASSWORD}@${MONGO_HOSTNAME}:${MONGO_PORT}/${MONGO_DB}?authSource=admin`;
  mongoose.connect(url).then(function () {
      console.log("MongoDB is Connected");
    })
    .catch((err) => console.log('err'));
};

const port = 3005;
app.use(cors({ origin: "*" })); // cors
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: false }));

app.listen(port, function () {
  connectDB();
  console.log(`Api corriendo en http://localhost:${port}!`);
});
app.get("/usuarios", async (req, res) => {
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

app.post("/", async (req, res) => {
  console.log(`Nueva peticion: POST /`);
  try {
    var data = req.body;
    var newUser = new User(data);
    await newUser.save();
    res.status(200).send({ 
      success: true, 
      message: "Usuario registrado", 
      outcome: [] });
  } catch (err) {
    res.status(400).send({
      success: false,
      message: "No se pudo registrar al usuario, intente de nuevo",
      outcome: [],
    });
  }
});
app.patch("/usuarios", async (req, res) => {
  console.log(`Nueva peticion: PATCH /usuarios`);
  
  const ALLOWED_FIELDS = ["name", "lastName", "username", "role", "password"];
  const IDENTIFIER_FIELDS = ["username"]; // Campos que pueden identificar al usuario
  
  try {
    const data = req.body;

    // Validar que tenemos al menos un campo identificador
    const hasIdentifier = IDENTIFIER_FIELDS.some(field => 
      data[field] && data[field].trim() !== ""
    );
    
    if (!hasIdentifier) {
      return res.status(400).send({
        success: false,
        message: `Se requiere al menos un campo identificador: ${IDENTIFIER_FIELDS.join(", ")}`,
        outcome: []
      });
    }

    // Verificar campos inválidos
    const invalidFields = Object.keys(data).filter(
      field => !ALLOWED_FIELDS.includes(field) && !IDENTIFIER_FIELDS.includes(field)
    );
    
    if (invalidFields.length > 0) {
      return res.status(400).send({
        success: false,
        message: `Campos inválidos: ${invalidFields.join(", ")}`,
        outcome: []
      });
    }

    // Construir criterio de búsqueda con los campos identificadores
    const searchCriteria = {};
    IDENTIFIER_FIELDS.forEach(field => {
      if (data[field] && data[field].trim() !== "") {
        searchCriteria[field] = data[field];
      }
    });

    // Separar datos de búsqueda de datos de actualización
    const updateData = {};
    ALLOWED_FIELDS.forEach(field => {
      if (data[field] !== undefined && data[field] !== null) {
        updateData[field] = data[field];
      }
    });

    // Si no hay campos válidos para actualizar (excluyendo identificadores)
    if (Object.keys(updateData).length === 0) {
      return res.status(400).send({
        success: false,
        message: "No se hay campos válidos para actualizar",
        outcome: []
      });
    }

    // Buscar usuario por identificadores alternativos
    const user = await User.findOne(searchCriteria);

    if (!user) {
      return res.status(404).send({
        success: false,
        message: "Usuario no encontrado con los criterios proporcionados",
        outcome: []
      });
    }

    // Actualizar los campos uno por uno (alternativa a findByIdAndUpdate)
    Object.keys(updateData).forEach(key => {
      user[key] = updateData[key];
    });

    // Guardar usuario actualizado
    const savedUser = await user.save();

    res.status(200).send({
      success: true,
      message: "Usuario actualizado exitosamente",
      outcome: [savedUser]
    });

  } catch (err) {
    // Manejo de errores específicos
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(error => error.message);
      return res.status(400).send({
        success: false,
        message: `Error de validación: ${messages.join(", ")}`,
        outcome: []
      });
    }
    
    if (err.code === 11000) {
      return res.status(400).send({
        success: false,
        message: "El nombre de usuario ya existe",
        outcome: []
      });
    }

    res.status(400).send({
      success: false,
      message: err.message || "No se pudo actualizar el usuario",
      outcome: []
    });
  }
});