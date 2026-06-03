require("dotenv").config();

const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const profileRoutes = require("./routes/profileRoutes");
const userRoutes          = require("./routes/userRoutes");
const notificationRoutes  = require("./routes/notificationRoutes");
const adminRoutes         = require("./routes/adminRoutes");

const app = express();

// MIDDLEWARE
app.use(express.json());
app.use(cors());
app.use('/uploads', require('express').static(require('path').join(__dirname, '../uploads')));

// RUTE
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/users",          userRoutes);
app.use("/api/notifications",  notificationRoutes);
app.use("/api/admin",          adminRoutes);

// VERIFICARE SĂNĂTATE
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// HANDLER GLOBAL DE ERORI
app.use((err, req, res, next) => {
  console.error("Eroare netratata:", err);
  res.status(500).json({
    error: "INTERNAL_SERVER_ERROR",
    message: "Ceva nu a mers bine pe server.",
  });
});

module.exports = app;
