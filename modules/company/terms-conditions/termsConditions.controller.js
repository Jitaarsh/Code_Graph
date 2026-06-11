import TermsConditions from "./termsConditions.model.js";

/**
 * @desc    Create a new T&C version
 * @route   POST /api/company/terms-conditions
 * @access  Private
 */
export const createTerms = async (req, res, next) => {
  try {
    const { versionLabel, content, status, isDefault, isReadOnly } = req.body;

    // If this new version is set as default, unset all others for this user
    if (isDefault) {
      await TermsConditions.updateMany(
        { createdBy: req.user._id },
        { $set: { isDefault: false } }
      );
    }

    // If status is 'active', archive the current active version for this user
    if (status === "active") {
      await TermsConditions.updateMany(
        { createdBy: req.user._id, status: "active" },
        { $set: { status: "archived" } }
      );
    }

    const terms = await TermsConditions.create({
      versionLabel,
      content,
      status: status || "draft",
      isDefault: isDefault || false,
      isReadOnly: isReadOnly || false,
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: "Terms & Conditions version created successfully",
      data: terms,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all T&C versions for the logged-in user
 * @route   GET /api/company/terms-conditions
 * @access  Private
 */
export const getAllTerms = async (req, res, next) => {
  try {
    const terms = await TermsConditions.find({ createdBy: req.user._id })
      .populate("createdBy", "ownerName email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: terms.length,
      data: terms,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get a single T&C version by ID
 * @route   GET /api/company/terms-conditions/:id
 * @access  Private
 */
export const getTermsById = async (req, res, next) => {
  try {
    const terms = await TermsConditions.findOne({
      _id: req.params.id,
      createdBy: req.user._id,
    }).populate("createdBy", "ownerName email");

    if (!terms) {
      return res.status(404).json({
        success: false,
        message: "Terms & Conditions version not found",
      });
    }

    res.status(200).json({ success: true, data: terms });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a T&C version
 * @route   PUT /api/company/terms-conditions/:id
 * @access  Private
 */
export const updateTerms = async (req, res, next) => {
  try {
    const existing = await TermsConditions.findOne({
      _id: req.params.id,
      createdBy: req.user._id,
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Terms & Conditions version not found",
      });
    }

    if (existing.isReadOnly) {
      return res.status(403).json({
        success: false,
        message: "This version is read-only and cannot be edited",
      });
    }

    const { isDefault, status } = req.body;

    // If making this the default, clear others
    if (isDefault) {
      await TermsConditions.updateMany(
        { createdBy: req.user._id, _id: { $ne: req.params.id } },
        { $set: { isDefault: false } }
      );
    }

    // If activating, archive the current active
    if (status === "active") {
      await TermsConditions.updateMany(
        { createdBy: req.user._id, status: "active", _id: { $ne: req.params.id } },
        { $set: { status: "archived" } }
      );
    }

    const updated = await TermsConditions.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: "Terms & Conditions version updated successfully",
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a T&C version
 * @route   DELETE /api/company/terms-conditions/:id
 * @access  Private
 */
export const deleteTerms = async (req, res, next) => {
  try {
    const terms = await TermsConditions.findOneAndDelete({
      _id: req.params.id,
      createdBy: req.user._id,
    });

    if (!terms) {
      return res.status(404).json({
        success: false,
        message: "Terms & Conditions version not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Terms & Conditions version deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Set a specific version as the active default
 * @route   PATCH /api/company/terms-conditions/:id/set-active
 * @access  Private
 */
export const setActiveTerms = async (req, res, next) => {
  try {
    // Archive all current active versions
    await TermsConditions.updateMany(
      { createdBy: req.user._id, status: "active" },
      { $set: { status: "archived" } }
    );
    // Clear all defaults
    await TermsConditions.updateMany(
      { createdBy: req.user._id },
      { $set: { isDefault: false } }
    );

    const terms = await TermsConditions.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user._id },
      { status: "active", isDefault: true },
      { new: true }
    );

    if (!terms) {
      return res.status(404).json({
        success: false,
        message: "Terms & Conditions version not found",
      });
    }

    res.status(200).json({
      success: true,
      message: `Version "${terms.versionLabel}" is now active`,
      data: terms,
    });
  } catch (error) {
    next(error);
  }
};
