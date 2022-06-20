const mongoose = require('mongoose');
const { Schema } = mongoose;

const TestStatsSchema = new Schema({
  testId: { type: String, required: true },
  stats: {
    uid: { type: String, required: true },
    startTime: { type: String, required: true, default: Date.now() },
    endTime: { type: String, required: true },
    questionsAnswered: [{ position: Number, answer: String }],
    currentPosition: { type: Number, default: 1 },
    percentage: Number,
    grade: Number,
    answers: { type: [String], required: true },
    correctAnswers: [Number],
    state: { type: String, enum: ['Working', 'Complete'], required: true },
  },
});

const TestStatsModel = mongoose.model('TestStats', TestStatsSchema);

module.exports = TestStatsModel;
