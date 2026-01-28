const mongoose = require("mongoose")

const healthRecordSchema = new mongoose.Schema(
  {
    cow: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Cow",
      required: [true, "Cow reference is required"],
    },
    observationDate: {
      type: Date,
      required: [true, "Observation date is required"],
    },
    symptoms: {
      type: String,
      required: [true, "Symptoms are required"],
    },
    diagnosis: {
      type: String,
    },
    treatment: {
      type: String,
    },
    vetName: {
      type: String,
    },
    followUpDate: {
      type: Date,
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
healthRecordSchema.index({ cow: 1, observationDate: -1 })
healthRecordSchema.index({ followUpDate: 1 })

module.exports = mongoose.model("HealthRecord", healthRecordSchema)
