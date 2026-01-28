const express = require("express")
const router = express.Router()
const authController = require("../controllers/authController")
const { isGuest, isAuthenticated } = require("../middleware/auth")
const { loginValidation, userValidation, validate } = require("../middleware/validation")

// Landing page (redirect to login or dashboard)
router.get("/", (req, res) => {
  if (req.session.userId) {
    return res.redirect("/dashboard")
  }
  res.redirect("/login")
})

// Login routes
router.get("/login", isGuest, authController.showLogin)
router.post("/login", isGuest, loginValidation, validate, authController.login)

// Register routes
router.get("/register", isGuest, authController.showRegister)
router.post("/register", isGuest, userValidation, validate, authController.register)

// Logout route
router.get("/logout", isAuthenticated, authController.logout)

module.exports = router
