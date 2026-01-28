const Vaccination = require("../models/Vaccination")
const Cow = require("../models/Cow")

// Show add vaccination form
exports.showAddForm = async (req, res) => {
  try {
    const cowId = req.query.cowId

    let selectedCow = null
    if (cowId) {
      selectedCow = await Cow.findById(cowId)
    }

    // Get all active cows for dropdown
    const cows = await Cow.find({ status: "active" }).sort({ earTag: 1 })

    res.render("vaccinations/add", {
      title: "Record Vaccination",
      cows,
      selectedCow,
    })
  } catch (error) {
    console.error("Error loading vaccination form:", error)
    req.flash("error", "Failed to load form")
    res.redirect("/dashboard")
  }
}

// Add vaccination record
exports.addVaccination = async (req, res) => {
  try {
    const { cowId, vaccineName, dosage, injectionDate, nextDueDate, administeredBy } = req.body

    const cow = await Cow.findById(cowId)
    if (!cow) {
      req.flash("error", "Cattle not found")
      return res.redirect("/vaccinations/add")
    }

    const vaccination = new Vaccination({
      cow: cowId,
      vaccineName,
      dosage,
      injectionDate,
      nextDueDate: nextDueDate || null,
      administeredBy,
      recordedBy: req.user._id, // Changed from req.session.userId to req.user._id for JWT auth
    })

    await vaccination.save()

    req.flash("success", `Vaccination recorded for ${cow.earTag}`)
    res.redirect(`/cows/${cowId}`)
  } catch (error) {
    console.error("Error adding vaccination:", error)
    req.flash("error", "Failed to add vaccination record")
    res.redirect("/vaccinations/add")
  }
}

// List all vaccinations
exports.listVaccinations = async (req, res) => {
  try {
    const page = Number.parseInt(req.query.page) || 1
    const limit = 20
    const skip = (page - 1) * limit

    const filter = {}
    if (req.query.cowId) {
      filter.cow = req.query.cowId
    }

    const totalRecords = await Vaccination.countDocuments(filter)
    const vaccinations = await Vaccination.find(filter)
      .sort({ injectionDate: -1 })
      .skip(skip)
      .limit(limit)
      .populate("cow", "earTag name")
      .populate("recordedBy", "name")

    const totalPages = Math.ceil(totalRecords / limit)

    res.render("vaccinations/list", {
      title: "Vaccination Records",
      vaccinations,
      currentPage: page,
      totalPages,
      totalRecords,
    })
  } catch (error) {
    console.error("Error fetching vaccinations:", error)
    req.flash("error", "Failed to load vaccination records")
    res.redirect("/dashboard")
  }
}

// Show edit form
exports.showEditForm = async (req, res) => {
  try {
    const vaccination = await Vaccination.findById(req.params.id).populate("cow", "earTag name")

    if (!vaccination) {
      req.flash("error", "Vaccination record not found")
      return res.redirect("/vaccinations")
    }

    res.render("vaccinations/edit", {
      title: "Edit Vaccination Record",
      vaccination,
    })
  } catch (error) {
    console.error("Error loading edit form:", error)
    req.flash("error", "Failed to load form")
    res.redirect("/vaccinations")
  }
}

// Update vaccination record
exports.updateVaccination = async (req, res) => {
  try {
    const { vaccineName, dosage, injectionDate, nextDueDate, administeredBy } = req.body

    const vaccination = await Vaccination.findById(req.params.id)

    if (!vaccination) {
      req.flash("error", "Vaccination record not found")
      return res.redirect("/vaccinations")
    }

    vaccination.vaccineName = vaccineName
    vaccination.dosage = dosage
    vaccination.injectionDate = injectionDate
    vaccination.nextDueDate = nextDueDate || null
    vaccination.administeredBy = administeredBy

    await vaccination.save()

    req.flash("success", "Vaccination record updated successfully")
    res.redirect(`/cows/${vaccination.cow}`)
  } catch (error) {
    console.error("Error updating vaccination:", error)
    req.flash("error", "Failed to update vaccination record")
    res.redirect(`/vaccinations/${req.params.id}/edit`)
  }
}

// Get overdue vaccinations
exports.getOverdueVaccinations = async (req, res) => {
  try {
    const today = new Date()

    const overdueVaccinations = await Vaccination.find({
      nextDueDate: { $lt: today },
    })
      .sort({ nextDueDate: 1 })
      .populate("cow", "earTag name status")
      .populate("recordedBy", "name")

    // Filter out vaccinations for non-active cows
    const activeOverdue = overdueVaccinations.filter((v) => v.cow.status === "active")

    res.render("vaccinations/overdue", {
      title: "Overdue Vaccinations",
      vaccinations: activeOverdue,
    })
  } catch (error) {
    console.error("Error fetching overdue vaccinations:", error)
    req.flash("error", "Failed to load overdue vaccinations")
    res.redirect("/dashboard")
  }
}

// Get upcoming vaccinations
exports.getUpcomingVaccinations = async (req, res) => {
  try {
    const today = new Date()
    const nextMonth = new Date()
    nextMonth.setDate(nextMonth.getDate() + 30)

    const upcomingVaccinations = await Vaccination.find({
      nextDueDate: { $gte: today, $lte: nextMonth },
    })
      .sort({ nextDueDate: 1 })
      .populate("cow", "earTag name status")
      .populate("recordedBy", "name")

    // Filter out vaccinations for non-active cows
    const activeUpcoming = upcomingVaccinations.filter((v) => v.cow.status === "active")

    res.render("vaccinations/upcoming", {
      title: "Upcoming Vaccinations",
      vaccinations: activeUpcoming,
    })
  } catch (error) {
    console.error("Error fetching upcoming vaccinations:", error)
    req.flash("error", "Failed to load upcoming vaccinations")
    res.redirect("/dashboard")
  }
}
