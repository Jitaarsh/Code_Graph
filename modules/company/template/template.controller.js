import Template from "./template.model.js";

/**
 * @desc    Get all quotation templates
 * @route   GET /api/company/template
 * @access  Private
 */
export const getTemplates = async (req, res) => {
  try {
    const templates = await Template.find().sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      data: templates
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch templates"
    });
  }
};

/**
 * @desc    Create a new template (Internal/Admin use)
 * @route   POST /api/company/template
 * @access  Private
 */
export const createTemplate = async (req, res) => {
  try {
    const template = new Template(req.body);
    const savedTemplate = await template.save();

    res.status(201).json({
      success: true,
      data: savedTemplate
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create template"
    });
  }
};
