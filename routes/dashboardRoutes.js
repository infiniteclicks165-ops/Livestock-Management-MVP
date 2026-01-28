const express = require("express")
const router = express.Router()
const dashboardController = require("../controllers/dashboardController")
const { isAuthenticated } = require("../middleware/auth")

// Dashboard
router.get("/", isAuthenticated, dashboardController.showDashboard)

// Reports
router.get("/reports", isAuthenticated, dashboardController.showReports)

module.exports = router
