const mongoose = require("mongoose")

const vaccinationSchema = new mongoose.Schema(
  {
    cow: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Cow",
      required: [true, "Cow reference is required"],
    },
    vaccineName: {
      type: String,
      required: [true, "Vaccine name is required"],
      trim: true,
    },
    dosage: {
      type: String,
      trim: true,
    },
    injectionDate: {
      type: Date,
      required: [true, "Injection date is required"],
    },
    nextDueDate: {
      type: Date,
    },
    administeredBy: {
      type: String,
      trim: true,
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  },
)

// Indexes for faster queries
vaccinationSchema.index({ cow: 1, injectionDate: -1 })
vaccinationSchema.index({ nextDueDate: 1 })

module.exports = mongoose.model("Vaccination", vaccinationSchema)
