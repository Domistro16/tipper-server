import mongoose from "mongoose";

const pointsSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  points: { type: Number, default: 0 }, // Points earned in the course
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model("Points", pointsSchema);
