const Cow = require("../models/Cow");
const HealthRecord = require("../models/HealthRecord");
const Vaccination = require("../models/Vaccination");
const ReproductionEvent = require("../models/ReproductionEvent");

// List all cows with pagination
exports.listCows = async (req, res) => {
  try {
    const page = Number.parseInt(req.query.page) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.status) {
      filter.status = req.query.status;
    }
    if (req.query.gender) {
      filter.gender = req.query.gender;
    }

    const totalCows = await Cow.countDocuments(filter);
    const cows = await Cow.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("motherCow", "earTag name");

    const totalPages = Math.ceil(totalCows / limit);

    res.render("cows/list", {
      title: "Cattle List",
      cows,
      currentPage: page,
      totalPages,
      totalCows,
      filter: req.query,
    });
  } catch (error) {
    console.error("Error fetching cows:", error);
    req.flash("error", "Failed to load cattle list");
    res.redirect("/dashboard");
  }
};

// Show add cow form
exports.showAddForm = async (req, res) => {
  try {
    // Get female cows for mother selection
    const femaleCows = await Cow.find({
      gender: "female",
      status: "active",
    }).sort({ earTag: 1 });

    res.render("cows/add", {
      title: "Add New Cattle",
      femaleCows,
    });
  } catch (error) {
    console.error("Error loading add form:", error);
    req.flash("error", "Failed to load form");
    res.redirect("/cows");
  }
};

// Add new cow
exports.addCow = async (req, res) => {
  try {
    const { earTag, name, gender, breed, dateOfBirth, motherCow, notes } =
      req.body;

    const cow = new Cow({
      earTag: earTag.toUpperCase(),
      name,
      gender,
      breed,
      dateOfBirth,
      motherCow: motherCow || null,
      notes,
      createdBy: req.user._id,
    });

    await cow.save();

    req.flash("success", `Cattle ${earTag} added successfully!`);
    res.redirect(`/cows/${cow._id}`);
  } catch (error) {
    console.error("Error adding cow:", error);
    if (error.code === 11000) {
      req.flash("error", "Ear tag already exists");
    } else {
      req.flash("error", "Failed to add cattle");
    }
    res.redirect("/cows/add");
  }
};

// Show cow details
exports.showCowDetails = async (req, res) => {
  try {
    const cow = await Cow.findById(req.params.id).populate(
      "motherCow",
      "earTag name"
    );

    if (!cow) {
      req.flash("error", "Cattle not found");
      return res.redirect("/cows");
    }

    // Get health records
    const healthRecords = await HealthRecord.find({ cow: cow._id })
      .sort({ observationDate: -1 })
      .limit(10)
      .populate("recordedBy", "name");

    // Get vaccinations
    const vaccinations = await Vaccination.find({ cow: cow._id })
      .sort({ injectionDate: -1 })
      .limit(10)
      .populate("recordedBy", "name");

    // Get reproduction events
    const reproductionEvents = await ReproductionEvent.find({
      motherCow: cow._id,
    })
      .sort({ createdAt: -1 })
      .populate("recordedBy", "name")
      .populate("calfDetails.cowId", "earTag name");

    // Get offspring (if this is a mother)
    const offspring = await Cow.find({ motherCow: cow._id }).sort({
      dateOfBirth: -1,
    });

    res.render("cows/details", {
      title: `${cow.earTag} - Details`,
      cow,
      healthRecords,
      vaccinations,
      reproductionEvents,
      offspring,
    });
  } catch (error) {
    console.error("Error fetching cow details:", error);
    req.flash("error", "Failed to load cattle details");
    res.redirect("/cows");
  }
};

// Show edit form
exports.showEditForm = async (req, res) => {
  try {
    const cow = await Cow.findById(req.params.id);

    if (!cow) {
      req.flash("error", "Cattle not found");
      return res.redirect("/cows");
    }

    // Get female cows for mother selection
    const femaleCows = await Cow.find({
      gender: "female",
      status: "active",
      _id: { $ne: cow._id },
    }).sort({ earTag: 1 });

    res.render("cows/edit", {
      title: `Edit ${cow.earTag}`,
      cow,
      femaleCows,
    });
  } catch (error) {
    console.error("Error loading edit form:", error);
    req.flash("error", "Failed to load form");
    res.redirect("/cows");
  }
};

// Update cow
exports.updateCow = async (req, res) => {
  try {
    const { name, gender, breed, dateOfBirth, motherCow, status, notes } =
      req.body;

    const cow = await Cow.findById(req.params.id);

    if (!cow) {
      req.flash("error", "Cattle not found");
      return res.redirect("/cows");
    }

    // Update fields
    cow.name = name;
    cow.gender = gender;
    cow.breed = breed;
    cow.dateOfBirth = dateOfBirth;
    cow.motherCow = motherCow || null;
    cow.status = status;
    cow.notes = notes;

    await cow.save();

    req.flash("success", "Cattle updated successfully!");
    res.redirect(`/cows/${cow._id}`);
  } catch (error) {
    console.error("Error updating cow:", error);
    req.flash("error", "Failed to update cattle");
    res.redirect(`/cows/${req.params.id}/edit`);
  }
};

// Delete cow (soft delete)
exports.deleteCow = async (req, res) => {
  try {
    const cow = await Cow.findById(req.params.id);

    if (!cow) {
      req.flash("error", "Cattle not found");
      return res.redirect("/cows");
    }

    // Check if cow has historical records
    const hasHealth = await HealthRecord.countDocuments({ cow: cow._id });
    const hasVaccinations = await Vaccination.countDocuments({ cow: cow._id });
    const hasReproduction = await ReproductionEvent.countDocuments({
      motherCow: cow._id,
    });

    if (hasHealth > 0 || hasVaccinations > 0 || hasReproduction > 0) {
      req.flash(
        "error",
        "Cannot delete cattle with historical records. Please change status instead."
      );
      return res.redirect(`/cows/${cow._id}`);
    }

    // Soft delete
    cow.status = "deceased";
    await cow.save();

    req.flash("success", "Cattle status updated to deceased");
    res.redirect("/cows");
  } catch (error) {
    console.error("Error deleting cow:", error);
    req.flash("error", "Failed to delete cattle");
    res.redirect("/cows");
  }
};
