const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Helper function to get user from JWT token
exports.getUserFromToken = async (req) => {
	try {
		const token = req.cookies.token;
		if (!token) return null;

		const decoded = jwt.verify(token, "this-is-my-secrete-jwt");
		const user = await User.findById(decoded.userId).select("-passwordHash");
		return user;
	} catch (error) {
		return null;
	}
};

// Check if user is authenticated
exports.isAuthenticated = async (req, res, next) => {
	try {
		const token = req.cookies.token;

		if (!token) {
			req.flash("error", "Please login to access this page");
			return res.redirect("/login");
		}

		const decoded = jwt.verify(token, "this-is-my-secrete-jwt");
		const user = await User.findById(decoded.userId);

		if (!user) {
			req.flash("error", "Invalid authentication token");
			res.clearCookie("token");
			return res.redirect("/login");
		}

		req.user = user;
		next();
	} catch (error) {
		console.error("Authentication error:", error);
		req.flash("error", "Invalid or expired token. Please login again.");
		res.clearCookie("token");
		res.redirect("/login");
	}
};

// Check if user is admin
exports.isAdmin = async (req, res, next) => {
	try {
		const token = req.cookies.token;

		if (!token) {
			req.flash("error", "Please login to access this page");
			return res.redirect("/login");
		}

		const decoded = jwt.verify(token, "this-is-my-secrete-jwt");
		const user = await User.findById(decoded.userId);

		if (!user || user.role !== "admin") {
			req.flash("error", "You do not have permission to access this page");
			return res.redirect("/dashboard");
		}

		req.user = user;
		next();
	} catch (error) {
		console.error("Authorization error:", error);
		req.flash("error", "Invalid or expired token");
		res.clearCookie("token");
		res.redirect("/login");
	}
};

// Check if user is guest (not authenticated)
exports.isGuest = (req, res, next) => {
	const token = req.cookies.token;

	if (!token) {
		return next();
	}

	// If token exists, redirect to dashboard
	res.redirect("/dashboard");
};
