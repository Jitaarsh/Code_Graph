import HelpTicket from "./helpCenter.model.js";

/**
 * @desc    Create new help ticket
 * @route   POST /api/company/help-center
 * @access  Private
 */
export const createTicket = async (req, res) => {
  try {
    const { subject, category, priority, description } = req.body;

    // Handle uploaded files
    const attachments = req.files ? req.files.map(file => `/uploads/tickets/${file.filename}`) : [];

    // 1. Generate sequential Ticket ID (#TK-XXXX)
    const count = await HelpTicket.countDocuments();
    const ticketId = `#TK-${(count + 8651).toString().padStart(4, "0")}`;

    const ticket = new HelpTicket({
      ticketId,
      subject,
      category,
      priority,
      description,
      attachments: attachments || [],
      createdBy: req.user.id,
    });

    const savedTicket = await ticket.save();

    res.status(201).json({
      success: true,
      message: "Support ticket created successfully",
      data: savedTicket,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create ticket",
    });
  }
};

/**
 * @desc    Get all tickets for the logged-in user
 * @route   GET /api/company/help-center
 * @access  Private
 */
export const getMyTickets = async (req, res) => {
  try {
    const tickets = await HelpTicket.find({ createdBy: req.user.id }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      count: tickets.length,
      data: tickets,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch tickets",
    });
  }
};

/**
 * @desc    Get single ticket details
 * @route   GET /api/company/help-center/:id
 * @access  Private
 */
export const getTicketById = async (req, res) => {
  try {
    const ticket = await HelpTicket.findOne({
      _id: req.params.id,
      createdBy: req.user.id,
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found or unauthorized",
      });
    }

    res.status(200).json({
      success: true,
      data: ticket,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch ticket details",
    });
  }
};
