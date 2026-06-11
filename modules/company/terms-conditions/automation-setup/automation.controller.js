import AutomationRule from "./automationRule.model.js";
import TermsConditions from "../termsConditions.model.js";

/**
 * createRule - Create a new T&C automation rule
 */
export const createRule = async (req, res) => {
  try {
    const { triggerType, triggerValue, tcVersion, status, priority } = req.body;

    // Check if TC Version exists
    const tcExists = await TermsConditions.findById(tcVersion);
    if (!tcExists) {
      return res.status(404).json({ message: "Specified T&C version not found" });
    }

    const rule = new AutomationRule({
      triggerType,
      triggerValue,
      tcVersion,
      status: status || "Active",
      priority: priority || 0,
      createdBy: req.user._id,
    });

    const savedRule = await rule.save();
    
    // Populate T&C version details before returning
    await savedRule.populate("tcVersion", "versionLabel versionId");

    res.status(201).json(savedRule);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * getRules - Get all automation rules for the current company
 */
export const getRules = async (req, res) => {
  try {
    const rules = await AutomationRule.find({ createdBy: req.user._id })
      .populate("tcVersion", "versionLabel versionId")
      .sort({ priority: -1, createdAt: -1 });

    res.json(rules);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * updateRule - Update an existing automation rule
 */
export const updateRule = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const rule = await AutomationRule.findOneAndUpdate(
      { _id: id, createdBy: req.user._id },
      updates,
      { new: true, runValidators: true }
    ).populate("tcVersion", "versionLabel versionId");

    if (!rule) {
      return res.status(404).json({ message: "Automation rule not found" });
    }

    res.json(rule);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * deleteRule - Delete an automation rule
 */
export const deleteRule = async (req, res) => {
  try {
    const { id } = req.params;

    const rule = await AutomationRule.findOneAndDelete({
      _id: id,
      createdBy: req.user._id,
    });

    if (!rule) {
      return res.status(404).json({ message: "Automation rule not found" });
    }

    res.json({ message: "Automation rule deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
