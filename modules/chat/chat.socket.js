import mongoose from "mongoose";
import HelpTicket from "../company/helpCenter/helpCenter.model.js";

const isAdminUser = (user) =>
  user?.role === "admin" || user?.role === "superadmin";

const getAccessibleTicket = async (ticketId, user) => {
  if (!mongoose.isValidObjectId(ticketId)) return null;

  const query = isAdminUser(user)
    ? { _id: ticketId }
    : { _id: ticketId, createdBy: user._id };

  return HelpTicket.findOne(query);
};

const chatSocket = (io) => {
  io.on("connection", (socket) => {
    console.log(`New client connected: ${socket.id} (User: ${socket.user.id})`);

    socket.on("join_ticket", async (ticketId) => {
      const ticket = await getAccessibleTicket(ticketId, socket.user);
      if (!ticket) {
        return socket.emit("error_message", {
          message: "Ticket not found or unauthorized",
        });
      }

      socket.join(`ticket_${ticketId}`);
      console.log(`User ${socket.user.id} joined ticket room: ticket_${ticketId}`);
    });

    socket.on("send_message", async (data) => {
      try {
        const { ticketId, text } = data;

        const ticket = await getAccessibleTicket(ticketId, socket.user);
        if (!ticket) {
          return socket.emit("error_message", {
            message: "Ticket not found or unauthorized",
          });
        }

        const role = isAdminUser(socket.user) ? "admin" : "user";
        const newMessage = {
          sender: socket.user.id,
          senderName:
            socket.user.ownerName ||
            socket.user.companyName ||
            (role === "admin" ? "Admin" : "User"),
          role,
          text,
          timestamp: new Date(),
        };

        ticket.messages.push(newMessage);
        ticket.lastUpdatedBy = socket.user.id;
        await ticket.save();

        io.to(`ticket_${ticketId}`).emit("receive_message", {
          ...newMessage,
          _id: ticket.messages[ticket.messages.length - 1]._id,
        });
      } catch (error) {
        console.error("Error sending message:", error);
        socket.emit("error_message", { message: "Failed to send message" });
      }
    });

    socket.on("disconnect", () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });
};

export default chatSocket;
