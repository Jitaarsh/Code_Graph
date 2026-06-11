import Invoice from "./invoice.model.js";
import ProfileSettings from "../profileSettings/profileSettings.model.js";

const getNextInvoiceNumber = async (userId, settings) => {
  const year = new Date().getFullYear();
  const prefix = settings?.invoicePrefix || `INV-${year}-`;
  let nextNumber = Number(settings?.invoiceStartNumber);

  if (!Number.isFinite(nextNumber) || nextNumber < 1) {
    nextNumber = settings ? 1001 : 1;
  }

  for (let attempts = 0; attempts < 10000; attempts += 1) {
    const paddedNumber = settings
      ? String(nextNumber)
      : String(nextNumber).padStart(4, "0");
    const invoiceNumber = `${prefix}${paddedNumber}`;
    const exists = await Invoice.exists({ createdBy: userId, invoiceNumber });

    if (!exists) {
      return {
        invoiceNumber,
        nextInvoiceStartNumber: nextNumber + 1,
      };
    }

    nextNumber += 1;
  }

  throw new Error("Unable to generate a unique invoice number");
};

/**
 * @desc    Create new invoice
 * @route   POST /api/company/invoice
 * @access  Private
 */
export const createInvoice = async (req, res) => {
  try {
    const userId = req.user._id;
    const { 
      customer, 
      issueDate,
      dueDate,
      items, 
      subtotal, 
      discountTotal, 
      taxTotal, 
      finalTotal, 
      internalNotes,
      currency,
      status,
      companyLogo
    } = req.body;

    // 1. Fetch Profile Settings for Numbering
    const settings = await ProfileSettings.findOne({ userId });
    
    const { invoiceNumber, nextInvoiceStartNumber } = await getNextInvoiceNumber(userId, settings);

    const invoice = new Invoice({
      invoiceNumber,
      customer,
      issueDate: issueDate || Date.now(),
      dueDate,
      items,
      subtotal,
      discountTotal,
      taxTotal,
      finalTotal,
      internalNotes,
      currency,
      status: status || "Draft",
      companyLogo,
      createdBy: userId
    });

    const savedInvoice = await invoice.save();
    
    // 2. Move the user's profile sequence past the saved invoice number.
    if (settings) {
      await ProfileSettings.findOneAndUpdate(
        { userId },
        { $set: { invoiceStartNumber: nextInvoiceStartNumber } }
      );
    }
    
    // Populate customer info for the response
    const populatedInvoice = await Invoice.findById(savedInvoice._id).populate("customer", "fullName businessName email");

    res.status(201).json({
      success: true,
      message: "Invoice created successfully",
      data: populatedInvoice
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create invoice"
    });
  }
};

/**
 * @desc    Get all invoices for the logged-in company user
 * @route   GET /api/company/invoice
 * @access  Private
 */
export const getInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find({ createdBy: req.user.id })
      .populate("customer", "fullName businessName email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: invoices
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch invoices"
    });
  }
};

/**
 * @desc    Get single invoice by ID
 * @route   GET /api/company/invoice/:id
 * @access  Private
 */
export const getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({ 
      _id: req.params.id, 
      createdBy: req.user.id 
    }).populate("customer");

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found"
      });
    }

    res.status(200).json({
      success: true,
      data: invoice
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch invoice"
    });
  }
};

/**
 * @desc    Update single invoice by ID
 * @route   PUT /api/company/invoice/:id
 * @access  Private
 */
export const updateInvoice = async (req, res) => {
  try {
    const {
      customer,
      issueDate,
      dueDate,
      items,
      subtotal,
      discountTotal,
      taxTotal,
      finalTotal,
      internalNotes,
      currency,
      status,
      companyLogo,
    } = req.body;

    const invoice = await Invoice.findOne({
      _id: req.params.id,
      createdBy: req.user.id,
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    invoice.customer = customer || invoice.customer;
    invoice.issueDate = issueDate || invoice.issueDate;
    invoice.dueDate = dueDate || invoice.dueDate;
    invoice.items = items || invoice.items;
    invoice.subtotal = subtotal ?? invoice.subtotal;
    invoice.discountTotal = discountTotal ?? invoice.discountTotal;
    invoice.taxTotal = taxTotal ?? invoice.taxTotal;
    invoice.finalTotal = finalTotal ?? invoice.finalTotal;
    invoice.internalNotes = internalNotes ?? invoice.internalNotes;
    invoice.currency = currency || invoice.currency;
    invoice.status = status || invoice.status;
    invoice.companyLogo = companyLogo !== undefined ? companyLogo : invoice.companyLogo;

    const updatedInvoice = await invoice.save();
    const populatedInvoice = await Invoice.findById(updatedInvoice._id).populate("customer");

    res.status(200).json({
      success: true,
      message: "Invoice updated successfully",
      data: populatedInvoice,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to update invoice",
    });
  }
};

/**
 * @desc    Update only the template settings for an invoice
 * @route   PATCH /api/company/invoice/:id/template
 * @access  Private
 */
export const updateTemplateSettings = async (req, res) => {
  try {
    const { templateId, bgImage, wmImage, wmOpacity, wmPosition } = req.body;

    const invoice = await Invoice.findOne({
      _id: req.params.id,
      createdBy: req.user.id,
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    invoice.templateSettings = {
      templateId:  templateId  ?? invoice.templateSettings?.templateId  ?? "simple",
      bgImage:     bgImage     ?? invoice.templateSettings?.bgImage     ?? null,
      wmImage:     wmImage     ?? invoice.templateSettings?.wmImage     ?? null,
      wmOpacity:   wmOpacity   ?? invoice.templateSettings?.wmOpacity   ?? 15,
      wmPosition:  wmPosition  ?? invoice.templateSettings?.wmPosition  ?? "center",
    };

    await invoice.save();

    res.status(200).json({
      success: true,
      message: "Template settings saved",
      data: invoice.templateSettings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to save template settings",
    });
  }
};

/**
 * @desc    Delete single invoice by ID
 * @route   DELETE /api/company/invoice/:id
 * @access  Private
 */
export const deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({
      _id: req.params.id,
      createdBy: req.user.id,
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    await Invoice.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Invoice deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to delete invoice",
    });
  }
};
