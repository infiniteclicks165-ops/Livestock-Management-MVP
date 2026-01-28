const express = require("express")
const router = express.Router()
const vaccinationController = require("../controllers/vaccinationController")
const { isAuthenticated } = require("../middleware/auth")
const { vaccinationValidation, validate } = require("../middleware/validation")

// List vaccinations
router.get("/", isAuthenticated, vaccinationController.listVaccinations)

// Add vaccination
router.get("/add", isAuthenticated, vaccinationController.showAddForm)
router.post("/add", isAuthenticated, vaccinationValidation, validate, vaccinationController.addVaccination)

// Edit vaccination
router.get("/:id/edit", isAuthenticated, vaccinationController.showEditForm)
router.post("/:id/edit", isAuthenticated, vaccinationValidation, validate, vaccinationController.updateVaccination)

// Overdue and upcoming
router.get("/overdue", isAuthenticated, vaccinationController.getOverdueVaccinations)
router.get("/upcoming", isAuthenticated, vaccinationController.getUpcomingVaccinations)

module.exports = router
