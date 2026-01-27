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

    isPublic: {
      type: Boolean,
      default: false, // false = Manual add only, true = Public Link
    },

    supportedLanguages: {
      type: [String],
      enum: ["cpp", "python", "java"],
      default: ["cpp", "python", "java"],
    },

    totalScore: {
      type: Number,
      default: 0,
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

    allowedCandidates: [
      {
        email: {
          type: String,
          required: true,
          lowercase: true,
          trim: true,
        },
        name: {
          type: String, // Added name for public registration
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
        registeredAt: {
          type: Date,
          default: Date.now,
        }
      },
    ],
  },
  { timestamps: true }
);

testSchema.methods.calculateTotalScore = async function () {
  await this.populate("questions");
  this.totalScore = this.questions.reduce((sum, q) => sum + (q.marks || 0), 0);
  this.depopulate("questions");
  await this.save();
  return this.totalScore;
};

export default mongoose.model("Test", testSchema);