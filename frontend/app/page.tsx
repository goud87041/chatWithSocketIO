"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { HiChatBubbleLeftRight } from "react-icons/hi2";

export default function Home() {
  const router = useRouter();

  return (
    <div className="landing-page">
      <motion.div
        className="landing-card"
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
      >
        <motion.div
          className="landing-icon"
          initial={{ rotate: -15, scale: 0 }}
          animate={{ rotate: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 15, delay: 0.2 }}
        >
          <HiChatBubbleLeftRight size={34} />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          ChatPulse
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          Connect instantly. Chat in real-time.
        </motion.p>

        <motion.div
          className="landing-actions"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <motion.button
            className="btn-primary"
            onClick={() => router.push("/login")}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            Login
          </motion.button>

          <motion.button
            className="btn-secondary"
            onClick={() => router.push("/register")}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            Create Account
          </motion.button>
        </motion.div>

        <motion.p
          className="landing-footer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          Join thousands of users chatting in real-time
        </motion.p>
      </motion.div>
    </div>
  );
}
