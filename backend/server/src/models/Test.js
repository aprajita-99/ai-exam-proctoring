import mongoose from "mongoose";

const testSchema = new mongoose.Schema(
  {
    testId: {
      type: String,
      required: true,
      unique: true,
    },

    title: {
      type: String,
      required: true,
    },

    duration: {
      type: Number,
      required: true,
    },

    activeTill: {
      type: Date,
      required: true,
    },

    questions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Question",
      },
    ],

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    /**
     * 🔐 Access Control List
     */
    allowedCandidates: [
      {
        email: {
          type: String,
          required: true,
          lowercase: true,
          trim: true,
        },

        passcodeHash: {
          type: String,
          required: true,
        },

        hasAttempted: {
          type: Boolean,
          default: false,
        },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("Test", testSchema);

