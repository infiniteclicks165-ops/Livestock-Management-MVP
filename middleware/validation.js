const { body, validationResult } = require("express-validator")

// Validation middleware to check for errors
exports.validate = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    req.flash("error", errors.array()[0].msg)
    return res.redirect("back")
  }
  next()
}

// Cow validation rules
exports.cowValidation = [
  body("earTag")
    .trim()
    .notEmpty()
    .withMessage("Ear tag is required")
    .isLength({ min: 2, max: 20 })
    .withMessage("Ear tag must be between 2 and 20 characters"),
  body("gender").notEmpty().withMessage("Gender is required").isIn(["male", "female"]).withMessage("Invalid gender"),
  body("breed").trim().notEmpty().withMessage("Breed is required"),
  body("dateOfBirth").notEmpty().withMessage("Date of birth is required").isDate().withMessage("Invalid date format"),
]

// Health record validation rules
exports.healthValidation = [
  body("observationDate")
    .notEmpty()
    .withMessage("Observation date is required")
    .isDate()
    .withMessage("Invalid date format"),
  body("symptoms").trim().notEmpty().withMessage("Symptoms are required"),
]

// Vaccination validation rules
exports.vaccinationValidation = [
  body("vaccineName").trim().notEmpty().withMessage("Vaccine name is required"),
  body("injectionDate")
    .notEmpty()
    .withMessage("Injection date is required")
    .isDate()
    .withMessage("Invalid date format"),
]

// Login validation rules
exports.loginValidation = [
  body("email").trim().notEmpty().withMessage("Email is required").isEmail().withMessage("Invalid email address"),
  body("password").notEmpty().withMessage("Password is required"),
]

// User registration validation rules
exports.userValidation = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email").trim().notEmpty().withMessage("Email is required").isEmail().withMessage("Invalid email address"),
  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
]
