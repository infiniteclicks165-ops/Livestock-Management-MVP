const express = require("express");
const mongoose = require("mongoose");
const flash = require("connect-flash");
const methodOverride = require("method-override");
const cookieParser = require("cookie-parser");
const path = require("path");
require("dotenv").config();

const app = express();

// Import routes
const authRoutes = require("./routes/authRoutes");
const cowRoutes = require("./routes/cowRoutes");
const healthRoutes = require("./routes/healthRoutes");
const vaccinationRoutes = require("./routes/vaccinationRoutes");
const reproductionRoutes = require("./routes/reproductionRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");

// Database connection
mongoose
  .connect("mongodb://localhost:27017/", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => console.error("MongoDB connection error:", err));

// View engine setup
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use(methodOverride("_method"));
app.use(cookieParser());

app.use((req, res, next) => {
  // Temporary flash storage in res.locals
  res.locals.success = req.cookies.flash_success || [];
  res.locals.error = req.cookies.flash_error || [];

  // Clear flash cookies after reading
  res.clearCookie("flash_success");
  res.clearCookie("flash_error");

  next();
});

app.use((req, res, next) => {
  req.flash = (type, message) => {
    const currentFlash = req.cookies[`flash_${type}`] || [];
    if (Array.isArray(currentFlash)) {
      currentFlash.push(message);
    } else {
      return res.cookie(`flash_${type}`, [message], { maxAge: 5000 });
    }
    res.cookie(`flash_${type}`, currentFlash, { maxAge: 5000 });
  };
  next();
});

const { getUserFromToken } = require("./middleware/auth");
app.use(async (req, res, next) => {
  const user = await getUserFromToken(req);
  res.locals.currentUser = user ? user._id : null;
  res.locals.userRole = user ? user.role : null;
  res.locals.userName = user ? user.name : null;
  next();
});

// Routes
app.use("/", authRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/cows", cowRoutes);
app.use("/health", healthRoutes);
app.use("/vaccinations", vaccinationRoutes);
app.use("/reproduction", reproductionRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).render("errors/404", { title: "Page Not Found" });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render("errors/500", {
    title: "Server Error",
    error: process.env.NODE_ENV === "development" ? err : {},
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT}`);
});
