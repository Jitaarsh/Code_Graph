import Customer from "./customer.model.js";
import {
  validateIntegrationConfig,
  fetchExternalCustomers,
  extractCustomerRecords,
  buildPreviewRows,
} from "./integration.helpers.js";


/**
 * @desc    Create a new customer
 * @route   POST /api/company/customers
 * @access  Private (Company User)
 */
export const createCustomer = async (req, res, next) => {
  try {
    const {
      fullName,
      businessName,
      email,
      phone,
      country,
      state,
      city,
      category,
      leadType,
      assignedUser,
      currency,
    } = req.body;

    // Check if a customer with this email already exists for this company user
    const existing = await Customer.findOne({
      email,
      createdBy: req.user._id,
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "A customer with this email already exists",
      });
    }

    const customer = await Customer.create({
      fullName,
      businessName,
      email,
      phone,
      country,
      state,
      city,
      category,
      leadType,
      assignedUser,
      currency,
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: "Customer created successfully",
      data: customer,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all customers for the logged-in company user
 * @route   GET /api/company/customers
 * @access  Private (Company User)
 */
export const getCustomers = async (req, res, next) => {
  try {
    const customers = await Customer.find({ createdBy: req.user._id })
      .populate("createdBy", "ownerName email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: customers.length,
      data: customers,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get a single customer by ID
 * @route   GET /api/company/customers/:id
 * @access  Private (Company User)
 */
export const getCustomerById = async (req, res, next) => {
  try {
    const customer = await Customer.findOne({
      _id: req.params.id,
      createdBy: req.user._id,
    }).populate("createdBy", "ownerName email");

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    res.status(200).json({
      success: true,
      data: customer,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a customer
 * @route   PUT /api/company/customers/:id
 * @access  Private (Company User)
 */
export const updateCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Customer updated successfully",
      data: customer,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a customer
 * @route   DELETE /api/company/customers/:id
 * @access  Private (Company User)
 */
export const deleteCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findOneAndDelete({
      _id: req.params.id,
      createdBy: req.user._id,
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Customer deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Bulk create customers from CSV data
 * @route   POST /api/company/customers/bulk
 * @access  Private (Company User)
 */
export const bulkCreateCustomers = async (req, res, next) => {
  try {
    const { customers } = req.body;

    if (!customers || !Array.isArray(customers) || customers.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide an array of customers",
      });
    }

    const results = { created: 0, skipped: 0, errors: [] };

    for (let i = 0; i < customers.length; i++) {
      const row = customers[i];
      try {
        const existing = await Customer.findOne({
          email: row.email,
          createdBy: req.user._id,
        });

        if (existing) {
          results.skipped++;
          results.errors.push(`Row ${i + 1}: Email "${row.email}" already exists`);
          continue;
        }

        const toTitleCase = (str) => {
          if (!str) return "";
          return str.split(" ").map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(" ");
        };

        await Customer.create({
          fullName: toTitleCase(row.fullName || ""),
          businessName: toTitleCase(row.businessName || ""),
          email: (row.email || "").toLowerCase().trim(),
          phone: row.phone || "",
          country: toTitleCase(row.country || "India"),
          state: toTitleCase(row.state || ""),
          city: toTitleCase(row.city || ""),
          category: (row.category || "individual").toLowerCase().trim(),
          leadType: (row.leadType || "hot").toLowerCase().trim(),
          assignedUser: row.assignedUser || "",
          currency: (row.currency || "INR").toUpperCase().trim(),
          createdBy: req.user._id,
        });
        results.created++;
      } catch (err) {
        results.skipped++;
        results.errors.push(`Row ${i + 1}: ${err.message}`);
      }
    }

    res.status(201).json({
      success: true,
      message: `Bulk import complete: ${results.created} created, ${results.skipped} skipped`,
      data: results,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Preview customers from an external API
 * @route   POST /api/company/customers/integrations/preview
 * @access  Private (Company User)
 */
export const previewCustomersFromApi = async (req, res, next) => {
  try {
    const validation = validateIntegrationConfig(req.body);
    if (validation.error) {
      return res.status(400).json({
        success: false,
        message: validation.error,
      });
    }

    const config = validation.value;
    const payload = await fetchExternalCustomers(config);
    const records = extractCustomerRecords(payload, config.dataPath);
    const previewRows = buildPreviewRows(
      records.slice(0, 20),
      config.fieldMapping,
      config.defaults,
      req.user.ownerName
    );

    const validRows = previewRows.filter((row) => row.valid).length;

    res.status(200).json({
      success: true,
      message: "Preview generated successfully.",
      data: {
        totalRecords: records.length,
        previewCount: previewRows.length,
        validRows,
        invalidRows: previewRows.length - validRows,
        previewRows,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Import customers from an external API
 * @route   POST /api/company/customers/integrations/import
 * @access  Private (Company User)
 */
export const importCustomersFromApi = async (req, res, next) => {
  try {
    const validation = validateIntegrationConfig(req.body);
    if (validation.error) {
      return res.status(400).json({
        success: false,
        message: validation.error,
      });
    }

    const config = validation.value;
    const payload = await fetchExternalCustomers(config);
    const records = extractCustomerRecords(payload, config.dataPath);
    const previewRows = buildPreviewRows(
      records,
      config.fieldMapping,
      config.defaults,
      req.user.ownerName
    );

    const results = {
      imported: 0,
      skipped: 0,
      invalid: 0,
      totalRecords: records.length,
      errors: [],
    };

    for (const row of previewRows) {
      if (!row.valid || !row.customer) {
        results.invalid++;
        results.errors.push(
          `Row ${row.rowNumber}: missing required mapped fields like name or email.`
        );
        continue;
      }

      const existing = await Customer.findOne({
        email: row.customer.email,
        createdBy: req.user._id,
      });

      if (existing) {
        results.skipped++;
        results.errors.push(
          `Row ${row.rowNumber}: email "${row.customer.email}" already exists.`
        );
        continue;
      }

      await Customer.create({
        ...row.customer,
        createdBy: req.user._id,
      });
      results.imported++;
    }

    res.status(201).json({
      success: true,
      message: `Import complete: ${results.imported} customers added, ${results.skipped} skipped, ${results.invalid} invalid.`,
      data: results,
    });
  } catch (error) {
    next(error);
  }
};
