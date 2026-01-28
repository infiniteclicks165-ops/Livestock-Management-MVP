const Cow = require("../models/Cow")
const HealthRecord = require("../models/HealthRecord")
const Vaccination = require("../models/Vaccination")
const ReproductionEvent = require("../models/ReproductionEvent")

// Show dashboard
exports.showDashboard = async (req, res) => {
  try {
    // Get statistics
    const totalCows = await Cow.countDocuments()
    const activeCows = await Cow.countDocuments({ status: "active" })
    const soldCows = await Cow.countDocuments({ status: "sold" })
    const deceasedCows = await Cow.countDocuments({ status: "deceased" })

    const maleCows = await Cow.countDocuments({ gender: "male", status: "active" })
    const femaleCows = await Cow.countDocuments({ gender: "female", status: "active" })

    // Pregnant cows
    const pregnantCount = await ReproductionEvent.countDocuments({
      pregnancyConfirmedDate: { $exists: true, $ne: null },
      birthDate: null,
    })

    // Overdue vaccinations
    const today = new Date()
    const overdueVaccinations = await Vaccination.find({
      nextDueDate: { $lt: today },
    }).populate("cow", "status")

    const activeOverdueCount = overdueVaccinations.filter((v) => v.cow && v.cow.status === "active").length

    // Upcoming vaccinations (next 7 days)
    const nextWeek = new Date()
    nextWeek.setDate(nextWeek.getDate() + 7)
    const upcomingVaccinations = await Vaccination.find({
      nextDueDate: { $gte: today, $lte: nextWeek },
    }).populate("cow", "status")

    const activeUpcomingCount = upcomingVaccinations.filter((v) => v.cow && v.cow.status === "active").length

    // Recent health issues (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const recentHealthIssues = await HealthRecord.countDocuments({
      observationDate: { $gte: thirtyDaysAgo },
    })

    // Births this year
    const yearStart = new Date(new Date().getFullYear(), 0, 1)
    const birthsThisYear = await ReproductionEvent.countDocuments({
      birthDate: { $gte: yearStart },
    })

    // Get recent activities
    const recentCows = await Cow.find().sort({ createdAt: -1 }).limit(5).populate("createdBy", "name")

    const recentHealth = await HealthRecord.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("cow", "earTag name")
      .populate("recordedBy", "name")

    const recentVaccinations = await Vaccination.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("cow", "earTag name")
      .populate("recordedBy", "name")

    // Upcoming due dates
    const upcomingDueDates = await ReproductionEvent.find({
      expectedDueDate: { $gte: today },
      birthDate: null,
    })
      .sort({ expectedDueDate: 1 })
      .limit(5)
      .populate("motherCow", "earTag name status")

    const activeUpcomingDueDates = upcomingDueDates.filter((e) => e.motherCow && e.motherCow.status === "active")

    res.render("dashboard/index", {
      title: "Dashboard",
      stats: {
        totalCows,
        activeCows,
        soldCows,
        deceasedCows,
        maleCows,
        femaleCows,
        pregnantCount,
        overdueVaccinationsCount: activeOverdueCount,
        upcomingVaccinationsCount: activeUpcomingCount,
        recentHealthIssues,
        birthsThisYear,
      },
      recentCows,
      recentHealth,
      recentVaccinations,
      upcomingDueDates: activeUpcomingDueDates,
    })
  } catch (error) {
    console.error("Dashboard error:", error)
    req.flash("error", "Failed to load dashboard")
    res.redirect("/login")
  }
}

// Show reports page
exports.showReports = async (req, res) => {
  try {
    const currentYear = new Date().getFullYear()

    // Births by month this year
    const birthsByMonth = await ReproductionEvent.aggregate([
      {
        $match: {
          birthDate: {
            $gte: new Date(currentYear, 0, 1),
            $lte: new Date(currentYear, 11, 31),
          },
        },
      },
      {
        $group: {
          _id: { $month: "$birthDate" },
          count: { $sum: 1 },
          totalCalves: { $sum: "$numberOfCalves" },
        },
      },
      { $sort: { _id: 1 } },
    ])

    // Health records by month
    const healthByMonth = await HealthRecord.aggregate([
      {
        $match: {
          observationDate: {
            $gte: new Date(currentYear, 0, 1),
            $lte: new Date(currentYear, 11, 31),
          },
        },
      },
      {
        $group: {
          _id: { $month: "$observationDate" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ])

    // Vaccinations by month
    const vaccinationsByMonth = await Vaccination.aggregate([
      {
        $match: {
          injectionDate: {
            $gte: new Date(currentYear, 0, 1),
            $lte: new Date(currentYear, 11, 31),
          },
        },
      },
      {
        $group: {
          _id: { $month: "$injectionDate" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ])

    // Cattle by breed
    const cattleByBreed = await Cow.aggregate([
      { $match: { status: "active" } },
      {
        $group: {
          _id: "$breed",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ])

    // Age distribution
    const allCows = await Cow.find({ status: "active" })
    const ageDistribution = {
      calf: 0, // 0-1 year
      young: 0, // 1-3 years
      mature: 0, // 3-8 years
      senior: 0, // 8+ years
    }

    allCows.forEach((cow) => {
      const ageInMonths = cow.ageInMonths
      if (ageInMonths < 12) ageDistribution.calf++
      else if (ageInMonths < 36) ageDistribution.young++
      else if (ageInMonths < 96) ageDistribution.mature++
      else ageDistribution.senior++
    })

    res.render("dashboard/reports", {
      title: "Reports & Analytics",
      currentYear,
      birthsByMonth,
      healthByMonth,
      vaccinationsByMonth,
      cattleByBreed,
      ageDistribution,
    })
  } catch (error) {
    console.error("Reports error:", error)
    req.flash("error", "Failed to load reports")
    res.redirect("/dashboard")
  }
}
