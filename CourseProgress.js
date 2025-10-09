import mongoose from "mongoose";

const courseProgressSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  courseId: { type: String, required: true },
  completedLessons: { type: [Number], default: [] },
  lastWatched: { type: Number, default: 0 },
  progress: { type: Number, default: 0 }, // Percentage of course completed
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model("CourseProgress", courseProgressSchema);
