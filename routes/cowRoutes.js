const express = require("express");
const router = express.Router();
const cowController = require("../controllers/cowController");
const { isAuthenticated, isAdmin } = require("../middleware/auth");
const { cowValidation, validate } = require("../middleware/validation");

// List cows
router.get("/", isAuthenticated, cowController.listCows);

// Add cow
router.get("/add", isAuthenticated, cowController.showAddForm);
router.post(
  "/add",
  isAuthenticated,
  cowValidation,
  validate,
  cowController.addCow
);

// View cow details
router.get("/:id", isAuthenticated, cowController.showCowDetails);

// Edit cow
router.get("/:id/edit", isAuthenticated, cowController.showEditForm);
router.post(
  "/:id/edit",
  isAuthenticated,
  cowValidation,
  validate,
  cowController.updateCow
);

// Delete cow (admin only)
router.post("/:id/delete", isAuthenticated, isAdmin, cowController.deleteCow);

module.exports = router;
