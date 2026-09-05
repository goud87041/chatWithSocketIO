import mongoose, { Schema, Document } from "mongoose";

export interface IMessage extends Document {
  from: string;
  to: string;
  content: string;
  timestamp: number;
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
  },
  { timestamps: true }
);

// Compound index for efficient chat history queries
messageSchema.index({ from: 1, to: 1, timestamp: -1 });

const Message = mongoose.model<IMessage>("Message", messageSchema);
export default Message;
