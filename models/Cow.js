const mongoose = require("mongoose")

const cowSchema = new mongoose.Schema(
  {
    earTag: {
      type: String,
      required: [true, "Ear tag is required"],
      unique: true,
      trim: true,
      uppercase: true,
    },
    name: {
      type: String,
      trim: true,
    },
    gender: {
      type: String,
      enum: ["male", "female"],
      required: [true, "Gender is required"],
    },
    breed: {
      type: String,
      required: [true, "Breed is required"],
      trim: true,
    },
    dateOfBirth: {
      type: Date,
      required: [true, "Date of birth is required"],
    },
    motherCow: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Cow",
    },
    status: {
      type: String,
      enum: ["active", "sold", "deceased"],
      default: "active",
    },
    notes: {
      type: String,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  },
)

// Index for faster queries
cowSchema.index({ earTag: 1 })
cowSchema.index({ status: 1 })
cowSchema.index({ motherCow: 1 })

// Virtual for age
cowSchema.virtual("age").get(function () {
  const today = new Date()
  const birthDate = new Date(this.dateOfBirth)
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  return age
})

// Virtual for age in months
cowSchema.virtual("ageInMonths").get(function () {
  const today = new Date()
  const birthDate = new Date(this.dateOfBirth)
  const months = (today.getFullYear() - birthDate.getFullYear()) * 12 + (today.getMonth() - birthDate.getMonth())
  return months
})

cowSchema.set("toJSON", { virtuals: true })
cowSchema.set("toObject", { virtuals: true })

module.exports = mongoose.model("Cow", cowSchema)
