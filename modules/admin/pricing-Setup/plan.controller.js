import Plan from "./plan.model.js";

/**
 * ── Admin Plan Controller ────────────────────────────────────
 * Full CRUD for subscription plan management.
 * All routes are admin-protected (see plan.routes.js).
 */

/**
 * @desc    Get ALL plans (including inactive), sorted by sortOrder then price
 * @route   GET /api/admin/plans
 * @access  Admin
 */
export const getAllPlans = async (req, res, next) => {
  try {
    const plans = await Plan.find({}).sort({ sortOrder: 1, price: 1 });

    res.status(200).json({
      success: true,
      count: plans.length,
      data: plans,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get a single plan by ID
 * @route   GET /api/admin/plans/:id
 * @access  Admin
 */
export const getPlanById = async (req, res, next) => {
  try {
    const plan = await Plan.findById(req.params.id);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Plan not found",
      });
    }

    res.status(200).json({
      success: true,
      data: plan,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new plan
 * @route   POST /api/admin/plans
 * @access  Admin
 */
export const createPlan = async (req, res, next) => {
  try {
    const {
      name,
      shortDescription,
      currency,
      billingCycle,
      price,
      discountPercent,
      features,
      isActive,
      sortOrder,
    } = req.body;

    // Check for duplicate plan name (case-insensitive)
    const existing = await Plan.findOne({
      name: { $regex: new RegExp(`^${name}$`, "i") },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: `A plan named "${name}" already exists. Please choose a different name.`,
      });
    }

    const plan = await Plan.create({
      name,
      shortDescription,
      currency: currency || "USD",
      billingCycle: billingCycle || "monthly",
      price,
      discountPercent: discountPercent || 0,
      features: features || [],
      isActive: isActive !== undefined ? isActive : true,
      sortOrder: sortOrder || 0,
    });

    res.status(201).json({
      success: true,
      message: `Plan "${plan.name}" created successfully`,
      data: plan,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update an existing plan (full update)
 * @route   PUT /api/admin/plans/:id
 * @access  Admin
 */
export const updatePlan = async (req, res, next) => {
  try {
    const plan = await Plan.findById(req.params.id);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Plan not found",
      });
    }

    // Check for name conflict with other plans (exclude self)
    if (req.body.name && req.body.name !== plan.name) {
      const conflict = await Plan.findOne({
        _id: { $ne: req.params.id },
        name: { $regex: new RegExp(`^${req.body.name}$`, "i") },
      });

      if (conflict) {
        return res.status(400).json({
          success: false,
          message: `A plan named "${req.body.name}" already exists.`,
        });
      }
    }

    Object.assign(plan, req.body);
    const updatedPlan = await plan.save();

    res.status(200).json({
      success: true,
      message: `Plan "${updatedPlan.name}" updated successfully`,
      data: updatedPlan,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Toggle a plan's active status (Active <-> Inactive)
 * @route   PATCH /api/admin/plans/:id/toggle
 * @access  Admin
 */
export const togglePlanStatus = async (req, res, next) => {
  try {
    const plan = await Plan.findById(req.params.id);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Plan not found",
      });
    }

    plan.isActive = !plan.isActive;
    await plan.save();

    res.status(200).json({
      success: true,
      message: `Plan "${plan.name}" is now ${plan.isActive ? "Active" : "Inactive"}`,
      data: plan,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a plan
 * @route   DELETE /api/admin/plans/:id
 * @access  Admin
 */
export const deletePlan = async (req, res, next) => {
  try {
    const plan = await Plan.findByIdAndDelete(req.params.id);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Plan not found",
      });
    }

    res.status(200).json({
      success: true,
      message: `Plan "${plan.name}" deleted successfully`,
    });
  } catch (error) {
    next(error);
  }
};

// ── Public Controller (for registration/plan selection) ──────

/**
 * @desc    Get all ACTIVE plans only — for public plan selection (registration page)
 * @route   GET /api/plans  (via planRoutes.js)
 * @access  Public
 */
export const getActivePlans = async (req, res, next) => {
  try {
    const plans = await Plan.find({ isActive: true }).sort({ sortOrder: 1, price: 1 });

    res.status(200).json({
      success: true,
      data: plans,
    });
  } catch (error) {
    next(error);
  }
};
