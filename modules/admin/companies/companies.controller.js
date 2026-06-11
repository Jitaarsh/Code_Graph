import User from "../../../models/User.js";

/**
 * @desc    Get all registered companies (users with role 'user')
 * @route   GET /api/admin/companies
 * @access  Private/Admin
 */
export const getAllCompanies = async (req, res) => {
  try {
    const companies = await User.find({ role: "user" })
      .populate("selectedPlan", "name price discountedPrice currency billingCycle duration")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: companies.length,
      data: companies,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch companies",
    });
  }
};

/**
 * @desc    Get a single company by ID
 * @route   GET /api/admin/companies/:id
 * @access  Private/Admin
 */
export const getCompanyById = async (req, res) => {
  try {
    const company = await User.findById(req.params.id)
      .populate("selectedPlan", "name price discountedPrice currency billingCycle duration")
      .select("-password");

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    res.status(200).json({
      success: true,
      data: company,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch company details",
    });
  }
};

/**
 * @desc    Update a company by ID
 * @route   PUT /api/admin/companies/:id
 * @access  Private/Admin
 */
export const updateCompanyById = async (req, res) => {
  try {
    const { companyName, ownerName, email, phone, status, address, city, state, pincode, selectedPlan } = req.body;

    const company = await User.findById(req.params.id);

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    // Update fields
    company.companyName = companyName || company.companyName;
    company.ownerName = ownerName || company.ownerName;
    company.email = email || company.email;
    company.phone = phone || company.phone;
    company.status = status || company.status;
    company.address = address || company.address;
    company.city = city || company.city;
    company.state = state || company.state;
    company.pincode = pincode || company.pincode;
    
    if (selectedPlan) {
      company.selectedPlan = selectedPlan;
    }

    const updatedCompany = await company.save();

    res.status(200).json({
      success: true,
      data: updatedCompany,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to update company",
    });
  }
};

/**
 * @desc    Delete a company by ID
 * @route   DELETE /api/admin/companies/:id
 * @access  Private/Admin
 */
export const deleteCompanyById = async (req, res) => {
  try {
    const company = await User.findOne({ _id: req.params.id, role: "user" });

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    await company.deleteOne();

    res.status(200).json({
      success: true,
      message: "Company deleted successfully",
      data: { id: req.params.id },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to delete company",
    });
  }
};
