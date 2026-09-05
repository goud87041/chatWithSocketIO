import mongoose, { Schema, Document } from "mongoose";

export interface IMessage extends Document {
  from: string;
  to: string;
  content: string;
  timestamp: number;
  status: "sent" | "delivered" | "seen";
}

const messageSchema = new Schema<IMessage>(
  {
    from: {
      type: String,
      required: true,
      index: true,
    },
    to: {
      type: String,
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: true,
      maxlength: 5000,
    },
    timestamp: {
      type: Number,
      required: true,
      default: Date.now,
      index: true,
    },
    status: {
      type: String,
      enum: ["sent", "delivered", "seen"],
      default: "sent",
      index: true,
    },
  },
  { timestamps: true }
);

// Compound indexes for efficient chat history and unread queries
messageSchema.index({ from: 1, to: 1, timestamp: -1 });
messageSchema.index({ to: 1, status: 1 });

const Message = mongoose.model<IMessage>("Message", messageSchema);
export default Message;
