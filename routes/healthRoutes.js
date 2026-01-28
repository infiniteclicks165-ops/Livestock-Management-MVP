const express = require("express")
const router = express.Router()
const healthController = require("../controllers/healthController")
const { isAuthenticated } = require("../middleware/auth")
const { healthValidation, validate } = require("../middleware/validation")

// List health records
router.get("/", isAuthenticated, healthController.listHealthRecords)

// Add health record
router.get("/add", isAuthenticated, healthController.showAddForm)
router.post("/add", isAuthenticated, healthValidation, validate, healthController.addHealthRecord)

// Edit health record
router.get("/:id/edit", isAuthenticated, healthController.showEditForm)
router.post("/:id/edit", isAuthenticated, healthValidation, validate, healthController.updateHealthRecord)

// Follow-ups
router.get("/follow-ups", isAuthenticated, healthController.getUpcomingFollowUps)

module.exports = router
