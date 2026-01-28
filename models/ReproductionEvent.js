const mongoose = require("mongoose")

const calfDetailSchema = new mongoose.Schema(
  {
    gender: {
      type: String,
      enum: ["male", "female"],
      required: true,
    },
    earTag: {
      type: String,
      required: true,
    },
    cowId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Cow",
    },
  },
  { _id: false },
)

const reproductionEventSchema = new mongoose.Schema(
  {
    motherCow: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Cow",
      required: [true, "Mother cow reference is required"],
    },
    matingDate: {
      type: Date,
    },
    method: {
      type: String,
      enum: ["natural", "artificial"],
      default: "natural",
    },
    bullId: {
      type: String,
      trim: true,
    },
    pregnancyConfirmedDate: {
      type: Date,
    },
    expectedDueDate: {
      type: Date,
    },
    birthDate: {
      type: Date,
    },
    numberOfCalves: {
      type: Number,
      min: 0,
    },
    calfDetails: [calfDetailSchema],
    complications: {
      type: Boolean,
      default: false,
    },
    notes: {
      type: String,
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
reproductionEventSchema.index({ motherCow: 1, createdAt: -1 })
reproductionEventSchema.index({ expectedDueDate: 1 })
reproductionEventSchema.index({ birthDate: -1 })

module.exports = mongoose.model("ReproductionEvent", reproductionEventSchema)
