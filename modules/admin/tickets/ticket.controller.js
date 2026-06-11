import HelpTicket from "../../company/helpCenter/helpCenter.model.js";
import User from "../../../models/User.js";
import sendEmail from "../../../Mail_sender/sendEmail.js";
import generateToken from "../../../utils/generateToken.js";

/**
 * @desc    Get all tickets across all companies
 * @route   GET /api/admin/tickets
 * @access  Private/Admin
 */
export const getAllTickets = async (req, res) => {
  try {
    const tickets = await HelpTicket.find()
      .populate("createdBy", "companyName ownerName email phone")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: tickets.length,
      data: tickets,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch all tickets",
    });
  }
};

/**
 * @desc    Get single ticket details (Admin only)
 * @route   GET /api/admin/tickets/:id
 * @access  Private/Admin
 */
export const getTicketById = async (req, res) => {
  try {
    const ticket = await HelpTicket.findById(req.params.id)
      .populate("createdBy", "companyName ownerName email phone")
      .populate("lastUpdatedBy", "ownerName email");

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
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

/**
 * @desc    Update ticket status (Admin only)
 * @route   PATCH /api/admin/tickets/:id/status
 * @access  Private/Admin
 */
export const updateTicketStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!["OPEN", "IN PROGRESS", "RESOLVED"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    const ticket = await HelpTicket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    ticket.status = status;
    ticket.lastUpdatedBy = req.user._id;
    await ticket.save();

    res.status(200).json({
      success: true,
      message: `Ticket status updated to ${status}`,
      data: ticket,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to update ticket status",
    });
  }
};

/**
 * @desc    Send system request OTP to ticket owner (SuperAdmin only)
 * @route   POST /api/admin/tickets/:id/system-request-otp
 * @access  Private/SuperAdmin
 */
export const sendSystemRequestOtp = async (req, res) => {
  try {
    if (req.user.role !== "superadmin") {
      return res.status(403).json({
        success: false,
        message: "Only SuperAdmin can send system request OTPs",
      });
    }

    const ticket = await HelpTicket.findById(req.params.id).populate(
      "createdBy",
      "companyName ownerName email"
    );

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    if (!ticket.createdBy?.email) {
      return res.status(400).json({
        success: false,
        message: "Ticket owner email not found",
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    await User.findByIdAndUpdate(ticket.createdBy._id, {
      otp,
      otpExpires,
    });

    await sendEmail({
      to: ticket.createdBy.email,
      subject: `System Request OTP - ${ticket.ticketId}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #145be9;">System Request Verification</h2>
          <p>Hello ${ticket.createdBy.ownerName || "User"},</p>
          <p>A SuperAdmin has requested system verification for your support ticket.</p>
          <div style="background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; margin: 20px 0;">
            <p style="margin: 0 0 8px;"><strong>Ticket:</strong> ${ticket.ticketId}</p>
            <p style="margin: 0;"><strong>Subject:</strong> ${ticket.subject}</p>
          </div>
          <p>Your OTP is:</p>
          <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #145be9; text-align: center; padding: 20px; background: #f0f6ff; border-radius: 12px;">
            ${otp}
          </div>
          <p style="color: #dc2626; font-weight: bold;">This OTP expires in 10 minutes.</p>
          <p>If you did not expect this request, please contact support.</p>
        </div>
      `,
    });

    res.status(200).json({
      success: true,
      message: `OTP sent to ${ticket.createdBy.email}`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to send system request OTP",
    });
  }
};

/**
 * @desc    Verify system request OTP and login as ticket owner (SuperAdmin only)
 * @route   POST /api/admin/tickets/:id/system-request-login
 * @access  Private/SuperAdmin
 */
export const systemRequestLogin = async (req, res) => {
  try {
    if (req.user.role !== "superadmin") {
      return res.status(403).json({
        success: false,
        message: "Only SuperAdmin can login with a system request OTP",
      });
    }

    const { otp } = req.body;

    if (!otp) {
      return res.status(400).json({
        success: false,
        message: "Please provide the OTP",
      });
    }

    const ticket = await HelpTicket.findById(req.params.id).populate(
      "createdBy",
      "companyName ownerName email phone gstNo website address city state pincode country role subscription status otp otpExpires"
    );

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    const user = await User.findById(ticket.createdBy._id).select("+otp");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Ticket owner not found",
      });
    }

    if (!user.otp || !user.otpExpires) {
      return res.status(400).json({
        success: false,
        message: "No OTP request found. Please send a new OTP.",
      });
    }

    if (new Date() > user.otpExpires) {
      user.otp = null;
      user.otpExpires = null;
      await user.save();
      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please send a new OTP.",
      });
    }

    if (user.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP. Please try again.",
      });
    }

    user.otp = null;
    user.otpExpires = null;
    await user.save();

    const token = generateToken(user._id.toString());

    res.status(200).json({
      success: true,
      message: `Logged in as ${user.companyName || user.email}`,
      data: {
        _id: user._id,
        companyName: user.companyName,
        ownerName: user.ownerName,
        email: user.email,
        phone: user.phone,
        gstNo: user.gstNo,
        website: user.website,
        address: user.address,
        city: user.city,
        state: user.state,
        pincode: user.pincode,
        country: user.country,
        role: user.role,
        subscription: user.subscription,
        status: user.status,
      },
      token,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to login with system request OTP",
    });
  }
};
