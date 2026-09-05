export interface User {
  id: string;
  username: string;
}

export interface Message {
  id: string;
  _id?: string; // MongoDB ObjectId (present in history responses)
  from: string;
  to: string;
  content: string;
  timestamp: number;
}

export interface ChatPartner {
  username: string;
  socketId: string;
  isOnline: boolean;
}
