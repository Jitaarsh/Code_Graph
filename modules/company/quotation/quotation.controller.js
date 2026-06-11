import Quotation from "./quotation.model.js";
import ProfileSettings from "../profileSettings/profileSettings.model.js";
import AutomationRule from "../terms-conditions/automation-setup/automationRule.model.js";
import TermsConditions from "../terms-conditions/termsConditions.model.js";
import Customer from "../customers/customer.model.js";
import sendEmail from "../../../Mail_sender/sendEmail.js";
import mongoose from "mongoose";

const templateMeta = {
  simple: {
    name: "Simple",
    description: "Clean, one-page minimal design.",
  },
  dual: {
    name: "Dual Page",
    description: "Two-page format with a detailed cover and quotation body.",
  },
  threepage: {
    name: "Three Page",
    description: "Expanded three-page proposal format.",
  },
  fourpage: {
    name: "Complete 4 Page",
    description: "Complete four-page proposal and quotation format.",
  },
};

const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const getClientBaseUrl = () =>
  (process.env.CLIENT_URL || process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "");

const getApiBaseUrl = (req) =>
  (process.env.API_URL || `${req.protocol}://${req.get("host")}/api`).replace(/\/$/, "");

const formatAmount = (amount = 0, currency = "INR") =>
  `${currency} ${Number(amount || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatEmailDate = (value) =>
  value ? new Date(value).toLocaleDateString("en-IN") : new Date().toLocaleDateString("en-IN");

const buildQuotationEmailHtml = ({ quotation, downloadUrl, acceptUrl, rejectUrl, companyName }) => {
  const customerName =
    quotation.customer?.fullName ||
    quotation.customer?.businessName ||
    "Customer";
  const templateId = quotation.templateSettings?.templateId || "simple";
  const template = templateMeta[templateId] || templateMeta.simple;
  const year = new Date().getFullYear();

  return `<!DOCTYPE html>
          <html>
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #145be9; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
                .header h1 { margin: 0; font-size: 28px; }
                .header p { margin: 8px 0 0 0; font-size: 14px; opacity: 0.9; }
                .content { background-color: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
                .quotation-number { font-size: 18px; font-weight: bold; color: #145be9; margin: 20px 0 10px 0; }
                .template-info { background-color: #eff6ff; border-left: 4px solid #145be9; padding: 16px; margin: 20px 0; border-radius: 4px; }
                .template-info h3 { margin: 0 0 8px 0; color: #145be9; font-size: 14px; }
                .template-info p { margin: 0; color: #555; font-size: 13px; }
                .download-button { display: inline-block; background-color: #145be9; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; text-align: center; cursor: pointer; }
                .download-button:hover { background-color: #0d47a1; }
                .response-button { display: inline-block; color: white; padding: 13px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 6px; text-align: center; }
                .accept-button { background-color: #059669; }
                .reject-button { background-color: #dc2626; }
                .footer { background-color: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 8px 8px; }
                .section-title { font-size: 16px; font-weight: bold; color: #1a2b4b; margin-top: 20px; margin-bottom: 10px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>Your Quotation is Ready</h1>
                  <p>Quotation: <strong>${escapeHtml(quotation.quotationNumber)}</strong></p>
                </div>
                <div class="content">
                  <p>Hello <strong>${escapeHtml(customerName)}</strong>,</p>
                  <p>Thank you for your interest! We've prepared a quotation for you. Please review the details below.</p>
                  <div class="quotation-number">Quotation #${escapeHtml(quotation.quotationNumber)}</div>
                  <div style="background-color: white; padding: 16px; border-radius: 6px; margin: 20px 0;">
                    <p style="margin: 0 0 10px 0;"><strong>Amount:</strong> ${escapeHtml(formatAmount(quotation.finalTotal, quotation.currency))}</p>
                    <p style="margin: 0;"><strong>Created:</strong> ${escapeHtml(formatEmailDate(quotation.createdAt))}</p>
                  </div>
                  <div class="template-info">
                    <h3>Quotation Format: ${escapeHtml(template.name)}</h3>
                    <p>${escapeHtml(template.description)}</p>
                  </div>
                  <div class="section-title">Download Your Quotation</div>
                  <p>Click the button below to download your quotation as a PDF:</p>
                  <div style="text-align: center;">
                    <a href="${escapeHtml(downloadUrl)}" class="download-button">Download PDF</a>
                  </div>
                  <div class="section-title">Your Decision</div>
                  <p>Please accept or reject this quotation using the buttons below. Your response will be shared with ${escapeHtml(companyName)}.</p>
                  <div style="text-align: center;">
                    <a href="${escapeHtml(acceptUrl)}" class="response-button accept-button">Accept Quotation</a>
                    <a href="${escapeHtml(rejectUrl)}" class="response-button reject-button">Reject Quotation</a>
                  </div>
                  <p style="font-size: 13px; color: #666; margin-top: 20px;">
                    <em>If the button above doesn't work, you can also copy and paste this link in your browser:</em>
                  </p>
                  <p style="font-size: 12px; color: #0066cc; word-break: break-all; background-color: #f0f0f0; padding: 10px; border-radius: 4px;">
                    ${escapeHtml(downloadUrl)}
                  </p>
                  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                  <p><strong>Questions?</strong></p>
                  <p>Feel free to reach out if you have any questions about this quotation. We're here to help!</p>
                  <p style="margin-top: 30px; color: #666; font-size: 13px;">
                    Best regards,<br>
                    <strong>${escapeHtml(companyName)}</strong>
                  </p>
                </div>
                <div class="footer">
                  <p style="margin: 0;">© ${year} ${escapeHtml(companyName)}. All rights reserved.</p>
                  <p style="margin: 8px 0 0 0; font-size: 11px;">This is an automated email, please do not reply directly.</p>
                </div>
              </div>
            </body>
          </html>`;
};

const buildQuotationResponseConfirmationHtml = ({ quotation, responseStatus, companyName }) => {
  const isAccepted = responseStatus === "Accepted";
  const color = isAccepted ? "#059669" : "#dc2626";
  const title = isAccepted ? "Quotation Accepted" : "Quotation Rejected";
  const message = isAccepted
    ? "Your acceptance has been recorded and shared with the company."
    : "Your rejection has been recorded and shared with the company.";

  return `<!DOCTYPE html>
          <html>
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>${escapeHtml(title)}</title>
              <style>
                body { margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #f3f6fb; font-family: Arial, sans-serif; color: #1a2b4b; }
                .card { width: min(92vw, 460px); background: #ffffff; border: 1px solid #e5e7eb; border-radius: 18px; padding: 34px; text-align: center; box-shadow: 0 22px 55px rgba(15, 23, 42, 0.12); }
                .icon { width: 58px; height: 58px; margin: 0 auto 18px; border-radius: 999px; background: ${color}; color: #ffffff; display: flex; align-items: center; justify-content: center; font-size: 30px; font-weight: 800; }
                h1 { margin: 0; font-size: 26px; line-height: 1.2; }
                p { margin: 12px 0 0; color: #64748b; font-size: 15px; line-height: 1.6; }
                .ref { margin-top: 20px; padding: 12px; border-radius: 12px; background: #f8fafc; color: #334155; font-size: 13px; font-weight: 700; }
              </style>
            </head>
            <body>
              <div class="card">
                <div class="icon">${isAccepted ? "✓" : "×"}</div>
                <h1>${escapeHtml(title)}</h1>
                <p>${escapeHtml(message)}</p>
                <div class="ref">Quotation: ${escapeHtml(quotation.quotationNumber)}</div>
                <p>You can close this tab now.</p>
                <p><strong>${escapeHtml(companyName)}</strong></p>
              </div>
            </body>
          </html>`;
};

const getOwnedCustomer = async (customerId, userId) => {
  if (!mongoose.isValidObjectId(customerId)) return null;
  return Customer.findOne({ _id: customerId, createdBy: userId });
};

const getNextQuotationNumber = async (userId, settings) => {
  const year = new Date().getFullYear();
  const prefix = settings?.quotePrefix || `QTN-${year}-`;
  let nextNumber = Number(settings?.quoteStartNumber);

  if (!Number.isFinite(nextNumber) || nextNumber < 1) {
    nextNumber = settings ? 500 : 1;
  }

  for (let attempts = 0; attempts < 10000; attempts += 1) {
    const paddedNumber = settings
      ? String(nextNumber)
      : String(nextNumber).padStart(4, "0");
    const quotationNumber = `${prefix}${paddedNumber}`;
    const exists = await Quotation.exists({ createdBy: userId, quotationNumber });

    if (!exists) {
      return {
        quotationNumber,
        nextQuoteStartNumber: nextNumber + 1,
      };
    }

    nextNumber += 1;
  }

  throw new Error("Unable to generate a unique quotation number");
};

/**
 * Helper to determine which T&C version to apply based on rules
 */
const selectTermsAndConditions = async (userId, quotationData) => {
  try {
    // 1. Fetch all active automation rules for this user
    const rules = await AutomationRule.find({ 
      createdBy: userId, 
      status: "Active" 
    }).sort({ priority: -1, createdAt: -1 });

    let matchedTcId = null;

    if (rules.length > 0) {
      // 2. Fetch customer for region matching if needed
      const customer = await getOwnedCustomer(quotationData.customer, userId);

      for (const rule of rules) {
        let match = false;

        if (rule.triggerType === "product_category") {
          // Rule matches if any item in the quotation belongs to the category
          // Note: items in quotationData might only have IDs, so we might need to fetch them 
          // or assume the frontend sent the category. In the current model, items store names but not categories.
          // For now, we'll check if any item's name/sku matches or if we should fetch products.
          // Let's keep it simple: check if any item in quotationData matches the triggerValue
          // (Assuming the triggerValue is the Category Name)
          // We'll fetch the items' products to be sure.
          // TO DO: Optimization - fetch products in bulk
        } else if (rule.triggerType === "quantity") {
          const totalQty = quotationData.items.reduce((sum, item) => sum + (item.qty || 0), 0);
          if (totalQty >= parseInt(rule.triggerValue)) {
            match = true;
          }
        } else if (rule.triggerType === "region") {
          if (customer && (customer.country === rule.triggerValue || customer.state === rule.triggerValue)) {
            match = true;
          }
        }

        if (match) {
          matchedTcId = rule.tcVersion;
          break; // Stop at first high-priority match
        }
      }
    }

    // 3. If no rule matched, find the default T&C
    let tcVersion = null;
    if (matchedTcId) {
      tcVersion = await TermsConditions.findById(matchedTcId);
    }

    if (!tcVersion) {
      tcVersion = await TermsConditions.findOne({ 
        createdBy: userId, 
        status: "active", 
        isDefault: true 
      });
    }

    // 4. Fallback: most recent active version
    if (!tcVersion) {
      tcVersion = await TermsConditions.findOne({ 
        createdBy: userId, 
        status: "active" 
      }).sort({ createdAt: -1 });
    }

    return tcVersion ? {
      versionId: tcVersion.versionId,
      content: tcVersion.content,
      sourceRef: tcVersion._id
    } : null;

  } catch (error) {
    console.error("Error in T&C Selection Engine:", error);
    return null;
  }
};


/**
 * @desc    Create new quotation
 * @route   POST /api/company/quotation
 * @access  Private
 */
export const createQuotation = async (req, res) => {
  try {
    const userId = req.user._id;
    const { 
      customer, 
      items, 
      subtotal, 
      discountTotal, 
      taxTotal, 
      finalTotal, 
      internalNotes,
      currency,
      status,
      templateSettings   // ← carry the user's chosen template through to the DB
    } = req.body;

    const ownedCustomer = await getOwnedCustomer(customer, userId);
    if (!ownedCustomer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found for this company",
      });
    }

    // 1. Fetch Profile Settings for Numbering
    const settings = await ProfileSettings.findOne({ userId });
    
    const { quotationNumber, nextQuoteStartNumber } = await getNextQuotationNumber(userId, settings);

    const quotation = new Quotation({
      quotationNumber,
      customer,
      items: items.map(item => ({
        ...item,
        productImage: item.productImage || null
      })),
      subtotal,
      discountTotal,
      taxTotal,
      finalTotal,
      internalNotes,
      currency,
      status: status || "Draft",
      createdBy: userId,
      templateSettings: templateSettings || { templateId: 'simple' }, // persist chosen template
    });

    // 2. Automate T&C Selection
    const selectedTc = await selectTermsAndConditions(userId, { customer, items });
    if (selectedTc) {
      quotation.termsAndConditions = selectedTc;
    }


    const savedQuotation = await quotation.save();
    
    // 2. Move the user's profile sequence past the saved quotation number.
    if (settings) {
      await ProfileSettings.findOneAndUpdate(
        { userId },
        { $set: { quoteStartNumber: nextQuoteStartNumber } }
      );
    }
    
    // Populate customer info for the response
    const populatedQuotation = await Quotation.findById(savedQuotation._id).populate("customer", "fullName businessName email");

    res.status(201).json({
      success: true,
      message: "Quotation created successfully",
      data: populatedQuotation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create quotation"
    });
  }
};

/**
 * @desc    Get all quotations for the logged-in company user
 * @route   GET /api/company/quotation
 * @access  Private
 */
export const getQuotations = async (req, res) => {
  try {
    const quotations = await Quotation.find({ createdBy: req.user._id })
      .populate("customer", "fullName businessName email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: quotations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch quotations"
    });
  }
};

/**
 * @desc    Get single quotation by ID
 * @route   GET /api/company/quotation/:id
 * @access  Private
 */
export const getQuotationById = async (req, res) => {
  try {
    const quotation = await Quotation.findOne({ 
      _id: req.params.id, 
      createdBy: req.user._id
    }).populate("customer");

    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: "Quotation not found"
      });
    }

    res.status(200).json({
      success: true,
      data: quotation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch quotation"
    });
  }
};

/**
 * @desc    Get a shared quotation for the emailed customer
 * @route   GET /api/company/quotation/public/:id?email=customer@example.com
 * @access  Public
 */
export const getSharedQuotation = async (req, res) => {
  try {
    const email = String(req.query.email || "").trim().toLowerCase();
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required to open this shared quotation",
      });
    }

    const quotation = await Quotation.findById(req.params.id)
      .populate("customer")
      .populate("createdBy", "companyName ownerName email");

    if (!quotation || quotation.customer?.email?.toLowerCase() !== email) {
      return res.status(404).json({
        success: false,
        message: "Shared quotation not found",
      });
    }

    res.status(200).json({
      success: true,
      data: quotation,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch shared quotation",
    });
  }
};

/**
 * @desc    Redirect emailed customer to the public quote download page
 * @route   GET /api/company/quotation/:id/download?email=customer@example.com
 * @access  Public
 */
export const downloadSharedQuotation = async (req, res) => {
  const email = String(req.query.email || "").trim();
  const url = `${getClientBaseUrl()}/shared-quotation/${encodeURIComponent(req.params.id)}?email=${encodeURIComponent(email)}&download=1`;
  return res.redirect(url);
};

/**
 * @desc    Accept or reject a shared quotation
 * @route   GET  /api/company/quotation/:id/respond/:action?email=customer@example.com
 * @route   POST /api/company/quotation/public/:id/respond
 * @access  Public
 */
export const respondToSharedQuotation = async (req, res) => {
  try {
    const email = String(req.query.email || req.body?.email || "").trim().toLowerCase();
    const rawAction = String(req.params.action || req.body?.action || "").trim().toLowerCase();
    const responseStatus =
      rawAction === "accept" || rawAction === "accepted"
        ? "Accepted"
        : rawAction === "reject" || rawAction === "rejected"
          ? "Rejected"
          : null;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required to respond to this quotation",
      });
    }

    if (!responseStatus) {
      return res.status(400).json({
        success: false,
        message: "Response must be accepted or rejected",
      });
    }

    const quotation = await Quotation.findById(req.params.id)
      .populate("customer", "email")
      .populate("createdBy", "companyName ownerName");

    if (!quotation || quotation.customer?.email?.toLowerCase() !== email) {
      return res.status(404).json({
        success: false,
        message: "Shared quotation not found",
      });
    }

    quotation.customerResponse = {
      status: responseStatus,
      respondedAt: new Date(),
      respondedByEmail: email,
    };
    await quotation.save();

    if (req.method === "GET") {
      const companyName =
        quotation.createdBy?.companyName ||
        quotation.createdBy?.ownerName ||
        "the company";

      return res
        .status(200)
        .send(buildQuotationResponseConfirmationHtml({ quotation, responseStatus, companyName }));
    }

    return res.status(200).json({
      success: true,
      message: `Quotation ${responseStatus.toLowerCase()} successfully`,
      data: quotation.customerResponse,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to save quotation response",
    });
  }
};

/**
 * @desc    Email selected quotations to their customers
 * @route   POST /api/company/quotation/share
 * @access  Private
 */
export const shareQuotations = async (req, res) => {
  try {
    const quotationIds = Array.isArray(req.body.quotationIds) ? req.body.quotationIds : [];
    const validIds = quotationIds.filter((id) => mongoose.isValidObjectId(id));

    if (validIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please select at least one quotation to share",
      });
    }

    const quotations = await Quotation.find({
      _id: { $in: validIds },
      createdBy: req.user._id,
    }).populate("customer", "fullName businessName email");

    if (quotations.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No matching quotations found",
      });
    }

    const apiBaseUrl = getApiBaseUrl(req);
    const companyName = req.user?.companyName || req.user?.ownerName || "Our Team";
    const results = [];

    for (const quotation of quotations) {
      const to = quotation.customer?.email;
      if (!to) {
        results.push({
          quotationId: quotation._id,
          success: false,
          message: "Customer email is missing",
        });
        continue;
      }

      const encodedEmail = encodeURIComponent(to);
      const downloadUrl = `${apiBaseUrl}/company/quotation/${quotation._id}/download?email=${encodedEmail}`;
      const acceptUrl = `${apiBaseUrl}/company/quotation/${quotation._id}/respond/accept?email=${encodedEmail}`;
      const rejectUrl = `${apiBaseUrl}/company/quotation/${quotation._id}/respond/reject?email=${encodedEmail}`;
      const html = buildQuotationEmailHtml({ quotation, downloadUrl, acceptUrl, rejectUrl, companyName });

      try {
        await sendEmail({
          to,
          subject: `Quotation ${quotation.quotationNumber} is ready`,
          html,
        });

        quotation.status = quotation.status === "Draft" ? "Sent" : quotation.status;
        await quotation.save();

        results.push({
          quotationId: quotation._id,
          success: true,
          email: to,
        });
      } catch (error) {
        results.push({
          quotationId: quotation._id,
          success: false,
          email: to,
          message: error.message || "Failed to send email",
        });
      }
    }

    const sentCount = results.filter((result) => result.success).length;

    res.status(sentCount > 0 ? 200 : 500).json({
      success: sentCount > 0,
      message:
        sentCount === quotations.length
          ? "Quotation email sent successfully"
          : `${sentCount} of ${quotations.length} quotation emails sent`,
      data: results,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to share quotations",
    });
  }
};

/**
 * @desc    Update single quotation by ID
 * @route   PUT /api/company/quotation/:id
 * @access  Private
 */
export const updateQuotation = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      customer,
      items,
      subtotal,
      discountTotal,
      taxTotal,
      finalTotal,
      internalNotes,
      currency,
      status,
    } = req.body;

    const quotation = await Quotation.findOne({
      _id: req.params.id,
      createdBy: userId,
    });

    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: "Quotation not found",
      });
    }

    if (customer) {
      const ownedCustomer = await getOwnedCustomer(customer, userId);
      if (!ownedCustomer) {
        return res.status(404).json({
          success: false,
          message: "Customer not found for this company",
        });
      }
      quotation.customer = customer;
    }
    quotation.items = items.map(item => ({
      ...item,
      productImage: item.productImage || null,
      description: item.description || ""
    }));
    quotation.subtotal = subtotal;
    quotation.discountTotal = discountTotal;
    quotation.taxTotal = taxTotal;
    quotation.finalTotal = finalTotal;
    quotation.internalNotes = internalNotes;
    quotation.currency = currency;
    quotation.status = status || quotation.status;

    const updatedQuotation = await quotation.save();
    const populatedQuotation = await Quotation.findById(updatedQuotation._id).populate("customer");

    res.status(200).json({
      success: true,
      message: "Quotation updated successfully",
      data: populatedQuotation,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to update quotation",
    });
  }
};

/**
 * @desc    Update only the template settings for a quotation
 * @route   PATCH /api/company/quotation/:id/template
 * @access  Private
 */
export const updateTemplateSettings = async (req, res) => {
  try {
    const { 
      templateId, 
      bgImage, bgOpacity, bgBlur, bgFit, bgTarget,
      wmImage, wmOpacity, wmPosition, wmSize, wmTarget,
      coverHeader, coverTitle, coverDescriptionTitle, coverDescription, coverFooterAddress, coverFooterWebsite,
      termsId 
    } = req.body;

    const quotation = await Quotation.findOne({
      _id: req.params.id,
      createdBy: req.user._id,
    });

    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: "Quotation not found",
      });
    }

    quotation.templateSettings = {
      templateId:  templateId  ?? quotation.templateSettings?.templateId  ?? "simple",
      bgImage:     bgImage     ?? quotation.templateSettings?.bgImage     ?? null,
      bgOpacity:   bgOpacity   ?? quotation.templateSettings?.bgOpacity   ?? 8,
      bgBlur:      bgBlur      ?? quotation.templateSettings?.bgBlur      ?? 0,
      bgFit:       bgFit       ?? quotation.templateSettings?.bgFit       ?? "cover",
      bgTarget:    bgTarget    ?? quotation.templateSettings?.bgTarget    ?? "all",
      wmImage:     wmImage     ?? quotation.templateSettings?.wmImage     ?? null,
      wmOpacity:   wmOpacity   ?? quotation.templateSettings?.wmOpacity   ?? 15,
      wmPosition:  wmPosition  ?? quotation.templateSettings?.wmPosition  ?? "center",
      wmSize:      wmSize      ?? quotation.templateSettings?.wmSize      ?? 120,
      wmTarget:    wmTarget    ?? quotation.templateSettings?.wmTarget    ?? "all",
      
      // Cover Details
      coverHeader:           coverHeader           ?? quotation.templateSettings?.coverHeader           ?? "PROJECT PROPOSAL",
      coverTitle:            coverTitle            ?? quotation.templateSettings?.coverTitle            ?? null,
      coverDescriptionTitle: coverDescriptionTitle ?? quotation.templateSettings?.coverDescriptionTitle ?? null,
      coverDescription:      coverDescription      ?? quotation.templateSettings?.coverDescription      ?? null,
      coverFooterAddress:    coverFooterAddress    ?? quotation.templateSettings?.coverFooterAddress    ?? null,
      coverFooterWebsite:    coverFooterWebsite    ?? quotation.templateSettings?.coverFooterWebsite    ?? null,
    };

    // If termsId is provided, snapshot the T&C content
    if (termsId) {
      const terms = await TermsConditions.findOne({ _id: termsId, createdBy: req.user._id });
      if (terms) {
        quotation.termsAndConditions = {
          versionId: terms.versionId,
          content: terms.content,
          sourceRef: terms._id,
        };
      }
    } else if (termsId === null) {
      // Explicitly clearing terms
      quotation.termsAndConditions = undefined;
    }

    await quotation.save();

    res.status(200).json({
      success: true,
      message: "Template settings saved",
      data: quotation.templateSettings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to save template settings",
    });
  }
};
