import Inquiry from "./inquiry.model.js";

/**
 * Get all inquiries for the company
 */
export const getInquiries = async (req, res) => {
  try {
    const inquiries = await Inquiry.find({ createdBy: req.user._id })
      .populate("product", "name sku")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: inquiries.length,
      data: inquiries,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Create a new inquiry
 */
export const createInquiry = async (req, res) => {
  try {
    const inquiry = await Inquiry.create({
      ...req.body,
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      data: inquiry,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Bulk create inquiries (for CSV import)
 */
export const bulkCreateInquiries = async (req, res) => {
  try {
    const inquiriesData = req.body.inquiries.map((inq) => ({
      ...inq,
      createdBy: req.user._id,
    }));

    const inquiries = await Inquiry.insertMany(inquiriesData);

    res.status(201).json({
      success: true,
      count: inquiries.length,
      data: inquiries,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Update inquiry status
 */
export const updateInquiryStatus = async (req, res) => {
  try {
    const inquiry = await Inquiry.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user._id },
      { status: req.body.status },
      { new: true, runValidators: true }
    );

    if (!inquiry) {
      return res.status(404).json({
        success: false,
        message: "Inquiry not found",
      });
    }

    res.status(200).json({
      success: true,
      data: inquiry,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Delete an inquiry
 */
export const deleteInquiry = async (req, res) => {
  try {
    const inquiry = await Inquiry.findOneAndDelete({
      _id: req.params.id,
      createdBy: req.user._id,
    });

    if (!inquiry) {
      return res.status(404).json({
        success: false,
        message: "Inquiry not found",
      });
    }

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Proxy fetch from an external URL
 */
export const fetchExternalInquiries = async (req, res) => {
  try {
    const { url, token } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        message: "External URL is required",
      });
    }

    const headers = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers["Authorization"] = token.startsWith("Bearer ") ? token : `Bearer ${token}`;
    }

    const response = await fetch(url, {
      method: "GET",
      headers: headers,
    });

    if (!response.ok) {
      throw new Error(`External API responded with status ${response.status}`);
    }

    const data = await response.json();

    res.status(200).json({
      success: true,
      data: data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

