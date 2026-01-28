const HealthRecord = require("../models/HealthRecord")
const Cow = require("../models/Cow")

// Show add health record form
exports.showAddForm = async (req, res) => {
  try {
    const cowId = req.query.cowId

    let selectedCow = null
    if (cowId) {
      selectedCow = await Cow.findById(cowId)
    }

    // Get all active cows for dropdown
    const cows = await Cow.find({ status: "active" }).sort({ earTag: 1 })

    res.render("health/add", {
      title: "Record Health Event",
      cows,
      selectedCow,
    })
  } catch (error) {
    console.error("Error loading health form:", error)
    req.flash("error", "Failed to load form")
    res.redirect("/dashboard")
  }
}

// Add health record
exports.addHealthRecord = async (req, res) => {
  try {
    const { cowId, observationDate, symptoms, diagnosis, treatment, vetName, followUpDate } = req.body

    const cow = await Cow.findById(cowId)
    if (!cow) {
      req.flash("error", "Cattle not found")
      return res.redirect("/health/add")
    }

    const healthRecord = new HealthRecord({
      cow: cowId,
      observationDate,
      symptoms,
      diagnosis,
      treatment,
      vetName,
      followUpDate: followUpDate || null,
      recordedBy: req.user._id, // Changed from req.session.userId to req.user._id for JWT auth
    })

    await healthRecord.save()

    req.flash("success", `Health record added for ${cow.earTag}`)
    res.redirect(`/cows/${cowId}`)
  } catch (error) {
    console.error("Error adding health record:", error)
    req.flash("error", "Failed to add health record")
    res.redirect("/health/add")
  }
}

// List all health records
exports.listHealthRecords = async (req, res) => {
  try {
    const page = Number.parseInt(req.query.page) || 1
    const limit = 20
    const skip = (page - 1) * limit

    const filter = {}
    if (req.query.cowId) {
      filter.cow = req.query.cowId
    }

    const totalRecords = await HealthRecord.countDocuments(filter)
    const healthRecords = await HealthRecord.find(filter)
      .sort({ observationDate: -1 })
      .skip(skip)
      .limit(limit)
      .populate("cow", "earTag name")
      .populate("recordedBy", "name")

    const totalPages = Math.ceil(totalRecords / limit)

    res.render("health/list", {
      title: "Health Records",
      healthRecords,
      currentPage: page,
      totalPages,
      totalRecords,
    })
  } catch (error) {
    console.error("Error fetching health records:", error)
    req.flash("error", "Failed to load health records")
    res.redirect("/dashboard")
  }
}

// Show edit form
exports.showEditForm = async (req, res) => {
  try {
    const healthRecord = await HealthRecord.findById(req.params.id).populate("cow", "earTag name")

    if (!healthRecord) {
      req.flash("error", "Health record not found")
      return res.redirect("/health")
    }

    res.render("health/edit", {
      title: "Edit Health Record",
      healthRecord,
    })
  } catch (error) {
    console.error("Error loading edit form:", error)
    req.flash("error", "Failed to load form")
    res.redirect("/health")
  }
}

// Update health record
exports.updateHealthRecord = async (req, res) => {
  try {
    const { observationDate, symptoms, diagnosis, treatment, vetName, followUpDate } = req.body

    const healthRecord = await HealthRecord.findById(req.params.id)

    if (!healthRecord) {
      req.flash("error", "Health record not found")
      return res.redirect("/health")
    }

    healthRecord.observationDate = observationDate
    healthRecord.symptoms = symptoms
    healthRecord.diagnosis = diagnosis
    healthRecord.treatment = treatment
    healthRecord.vetName = vetName
    healthRecord.followUpDate = followUpDate || null

    await healthRecord.save()

    req.flash("success", "Health record updated successfully")
    res.redirect(`/cows/${healthRecord.cow}`)
  } catch (error) {
    console.error("Error updating health record:", error)
    req.flash("error", "Failed to update health record")
    res.redirect(`/health/${req.params.id}/edit`)
  }
}

// Get upcoming follow-ups
exports.getUpcomingFollowUps = async (req, res) => {
  try {
    const today = new Date()
    const nextWeek = new Date()
    nextWeek.setDate(nextWeek.getDate() + 7)

    const followUps = await HealthRecord.find({
      followUpDate: { $gte: today, $lte: nextWeek },
    })
      .sort({ followUpDate: 1 })
      .populate("cow", "earTag name")
      .populate("recordedBy", "name")

    res.render("health/follow-ups", {
      title: "Upcoming Follow-ups",
      followUps,
    })
  } catch (error) {
    console.error("Error fetching follow-ups:", error)
    req.flash("error", "Failed to load follow-ups")
    res.redirect("/dashboard")
  }
}
