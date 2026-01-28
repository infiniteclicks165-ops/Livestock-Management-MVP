const express = require("express")
const router = express.Router()
const reproductionController = require("../controllers/reproductionController")
const { isAuthenticated } = require("../middleware/auth")

// List reproduction events
router.get("/", isAuthenticated, reproductionController.listReproductionEvents)

// Add reproduction event
router.get("/add", isAuthenticated, reproductionController.showAddForm)
router.post("/add", isAuthenticated, reproductionController.addReproductionEvent)

// Record birth
router.get("/:id/record-birth", isAuthenticated, reproductionController.showRecordBirthForm)
router.post("/:id/record-birth", isAuthenticated, reproductionController.recordBirth)

// Edit reproduction event
router.get("/:id/edit", isAuthenticated, reproductionController.showEditForm)
router.post("/:id/edit", isAuthenticated, reproductionController.updateReproductionEvent)

// Pregnant cows
router.get("/pregnant", isAuthenticated, reproductionController.getPregnantCows)

module.exports = router
