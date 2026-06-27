import mongoose from "mongoose";

const OpportunitySchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    oppId: { type: String, required: true, unique: true }, // Client-side generated timestamp/id
    type: { type: String, required: true },
    note: { type: String, default: "" },
    date: { type: String, required: true }, // YYYY-MM-DD
  },
  {
    timestamps: true,
  }
);

OpportunitySchema.index({ date: -1 });

export default mongoose.models.Opportunity || mongoose.model("Opportunity", OpportunitySchema);
