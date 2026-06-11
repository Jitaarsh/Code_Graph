import ProfileSettings from "./profileSettings.model.js";

/**
 * @desc    Get profile settings for the logged-in user
 * @route   GET /api/company/profile-settings
 * @access  Private
 */
export const getProfileSettings = async (req, res, next) => {
  try {
    let settings = await ProfileSettings.findOne({ userId: req.user._id });

    // If no settings exist yet, we can return defaults or create an empty record
    if (!settings) {
      // Option 1: Create a record with defaults immediately
      settings = await ProfileSettings.create({ userId: req.user._id });
    }

    res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update or create profile settings for the logged-in user
 * @route   PUT /api/company/profile-settings
 * @access  Private
 */
export const upsertProfileSettings = async (req, res, next) => {
  try {
    console.log("Upserting profile settings for user:", req.user?._id);
    
    const {
      invoicePrefix,
      invoiceStartNumber,
      quotePrefix,
      quoteStartNumber,
      defaultTaxRate,
      validityPeriod,
      paymentTerms,
      primaryLogo,
      secondaryLogo,
      primaryColor,
    } = req.body;

    // Log the payload to verify data types
    console.log("Settings updates payload:", {
      invoicePrefix,
      invoiceStartNumber,
      quotePrefix,
      quoteStartNumber,
      defaultTaxRate,
      validityPeriod,
      paymentTerms,
      primaryLogo,
      secondaryLogo,
      primaryColor,
    });

    const settings = await ProfileSettings.findOneAndUpdate(
      { userId: req.user._id },
      {
        invoicePrefix,
        invoiceStartNumber,
        quotePrefix,
        quoteStartNumber,
        defaultTaxRate,
        validityPeriod,
        paymentTerms,
        primaryLogo,
        secondaryLogo,
        primaryColor,
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    );

    console.log("Successfully persisted settings:", settings._id);

    res.status(200).json({
      success: true,
      message: "Profile settings updated successfully",
      data: settings,
    });
  } catch (error) {
    console.error("Error in upsertProfileSettings:", error.message);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to update profile settings",
    });
  }
};
