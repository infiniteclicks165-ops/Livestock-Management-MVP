const ReproductionEvent = require("../models/ReproductionEvent")
const Cow = require("../models/Cow")

// Show add reproduction event form
exports.showAddForm = async (req, res) => {
  try {
    const cowId = req.query.cowId

    let selectedCow = null
    if (cowId) {
      selectedCow = await Cow.findById(cowId)
      if (selectedCow && selectedCow.gender !== "female") {
        req.flash("error", "Reproduction events can only be recorded for female cattle")
        return res.redirect(`/cows/${cowId}`)
      }
    }

    // Get all female cows for dropdown
    const femaleCows = await Cow.find({ gender: "female", status: "active" }).sort({ earTag: 1 })

    res.render("reproduction/add", {
      title: "Record Reproduction Event",
      femaleCows,
      selectedCow,
    })
  } catch (error) {
    console.error("Error loading reproduction form:", error)
    req.flash("error", "Failed to load form")
    res.redirect("/dashboard")
  }
}

// Add reproduction event
exports.addReproductionEvent = async (req, res) => {
  try {
    const {
      motherCowId,
      matingDate,
      method,
      bullId,
      pregnancyConfirmedDate,
      expectedDueDate,
      birthDate,
      numberOfCalves,
      complications,
      notes,
    } = req.body

    const motherCow = await Cow.findById(motherCowId)
    if (!motherCow) {
      req.flash("error", "Mother cattle not found")
      return res.redirect("/reproduction/add")
    }

    if (motherCow.gender !== "female") {
      req.flash("error", "Only female cattle can have reproduction events")
      return res.redirect("/reproduction/add")
    }

    const reproductionEvent = new ReproductionEvent({
      motherCow: motherCowId,
      matingDate: matingDate || null,
      method,
      bullId,
      pregnancyConfirmedDate: pregnancyConfirmedDate || null,
      expectedDueDate: expectedDueDate || null,
      birthDate: birthDate || null,
      numberOfCalves: numberOfCalves || 0,
      complications: complications === "on",
      notes,
      recordedBy: req.user._id, // Changed from req.session.userId to req.user._id for JWT auth
    })

    await reproductionEvent.save()

    req.flash("success", `Reproduction event recorded for ${motherCow.earTag}`)
    res.redirect(`/cows/${motherCowId}`)
  } catch (error) {
    console.error("Error adding reproduction event:", error)
    req.flash("error", "Failed to add reproduction event")
    res.redirect("/reproduction/add")
  }
}

// Show record birth form
exports.showRecordBirthForm = async (req, res) => {
  try {
    const eventId = req.params.id
    const reproductionEvent = await ReproductionEvent.findById(eventId).populate("motherCow", "earTag name")

    if (!reproductionEvent) {
      req.flash("error", "Reproduction event not found")
      return res.redirect("/reproduction")
    }

    if (reproductionEvent.birthDate) {
      req.flash("error", "Birth has already been recorded for this event")
      return res.redirect(`/cows/${reproductionEvent.motherCow._id}`)
    }

    res.render("reproduction/record-birth", {
      title: "Record Birth",
      reproductionEvent,
    })
  } catch (error) {
    console.error("Error loading birth form:", error)
    req.flash("error", "Failed to load form")
    res.redirect("/reproduction")
  }
}

// Record birth and create calf records
exports.recordBirth = async (req, res) => {
  try {
    const eventId = req.params.id
    const { birthDate, numberOfCalves, complications, notes } = req.body

    const reproductionEvent = await ReproductionEvent.findById(eventId).populate("motherCow")

    if (!reproductionEvent) {
      req.flash("error", "Reproduction event not found")
      return res.redirect("/reproduction")
    }

    if (reproductionEvent.birthDate) {
      req.flash("error", "Birth has already been recorded for this event")
      return res.redirect(`/cows/${reproductionEvent.motherCow._id}`)
    }

    // Update reproduction event
    reproductionEvent.birthDate = birthDate
    reproductionEvent.numberOfCalves = numberOfCalves
    reproductionEvent.complications = complications === "on"
    if (notes) reproductionEvent.notes = notes

    // Get calf details from form
    const calfDetails = []
    for (let i = 0; i < numberOfCalves; i++) {
      const gender = req.body[`calf_${i}_gender`]
      const earTag = req.body[`calf_${i}_earTag`]

      if (gender && earTag) {
        // Create new cow record for calf
        const calf = new Cow({
          earTag: earTag.toUpperCase(),
          gender,
          breed: reproductionEvent.motherCow.breed,
          dateOfBirth: birthDate,
          motherCow: reproductionEvent.motherCow._id,
          status: "active",
          createdBy: req.user._id, // Changed from req.session.userId to req.user._id for JWT auth
        })

        await calf.save()

        calfDetails.push({
          gender,
          earTag: earTag.toUpperCase(),
          cowId: calf._id,
        })
      }
    }

    reproductionEvent.calfDetails = calfDetails
    await reproductionEvent.save()

    req.flash("success", `Birth recorded successfully! ${numberOfCalves} calf(ves) added to the system.`)
    res.redirect(`/cows/${reproductionEvent.motherCow._id}`)
  } catch (error) {
    console.error("Error recording birth:", error)
    if (error.code === 11000) {
      req.flash("error", "One of the ear tags already exists. Please use unique ear tags.")
    } else {
      req.flash("error", "Failed to record birth")
    }
    res.redirect(`/reproduction/${req.params.id}/record-birth`)
  }
}

// List all reproduction events
exports.listReproductionEvents = async (req, res) => {
  try {
    const page = Number.parseInt(req.query.page) || 1
    const limit = 20
    const skip = (page - 1) * limit

    const filter = {}
    if (req.query.cowId) {
      filter.motherCow = req.query.cowId
    }

    const totalRecords = await ReproductionEvent.countDocuments(filter)
    const reproductionEvents = await ReproductionEvent.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("motherCow", "earTag name status")
      .populate("recordedBy", "name")

    const totalPages = Math.ceil(totalRecords / limit)

    res.render("reproduction/list", {
      title: "Reproduction Records",
      reproductionEvents,
      currentPage: page,
      totalPages,
      totalRecords,
    })
  } catch (error) {
    console.error("Error fetching reproduction events:", error)
    req.flash("error", "Failed to load reproduction records")
    res.redirect("/dashboard")
  }
}

// Get pregnant cows
exports.getPregnantCows = async (req, res) => {
  try {
    const pregnantEvents = await ReproductionEvent.find({
      pregnancyConfirmedDate: { $exists: true, $ne: null },
      birthDate: null,
    })
      .sort({ expectedDueDate: 1 })
      .populate("motherCow", "earTag name status")
      .populate("recordedBy", "name")

    // Filter for active cows only
    const activePregnant = pregnantEvents.filter((e) => e.motherCow.status === "active")

    res.render("reproduction/pregnant", {
      title: "Pregnant Cattle",
      pregnantEvents: activePregnant,
    })
  } catch (error) {
    console.error("Error fetching pregnant cows:", error)
    req.flash("error", "Failed to load pregnant cattle")
    res.redirect("/dashboard")
  }
}

// Show edit form
exports.showEditForm = async (req, res) => {
  try {
    const reproductionEvent = await ReproductionEvent.findById(req.params.id).populate("motherCow", "earTag name")

    if (!reproductionEvent) {
      req.flash("error", "Reproduction event not found")
      return res.redirect("/reproduction")
    }

    res.render("reproduction/edit", {
      title: "Edit Reproduction Event",
      reproductionEvent,
    })
  } catch (error) {
    console.error("Error loading edit form:", error)
    req.flash("error", "Failed to load form")
    res.redirect("/reproduction")
  }
}

// Update reproduction event
exports.updateReproductionEvent = async (req, res) => {
  try {
    const { matingDate, method, bullId, pregnancyConfirmedDate, expectedDueDate, complications, notes } = req.body

    const reproductionEvent = await ReproductionEvent.findById(req.params.id)

    if (!reproductionEvent) {
      req.flash("error", "Reproduction event not found")
      return res.redirect("/reproduction")
    }

    // Don't allow editing if birth has been recorded
    if (reproductionEvent.birthDate) {
      req.flash("error", "Cannot edit reproduction event after birth has been recorded")
      return res.redirect(`/cows/${reproductionEvent.motherCow}`)
    }

    reproductionEvent.matingDate = matingDate || null
    reproductionEvent.method = method
    reproductionEvent.bullId = bullId
    reproductionEvent.pregnancyConfirmedDate = pregnancyConfirmedDate || null
    reproductionEvent.expectedDueDate = expectedDueDate || null
    reproductionEvent.complications = complications === "on"
    reproductionEvent.notes = notes

    await reproductionEvent.save()

    req.flash("success", "Reproduction event updated successfully")
    res.redirect(`/cows/${reproductionEvent.motherCow}`)
  } catch (error) {
    console.error("Error updating reproduction event:", error)
    req.flash("error", "Failed to update reproduction event")
    res.redirect(`/reproduction/${req.params.id}/edit`)
  }
}
