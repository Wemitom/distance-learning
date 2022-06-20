const mongoose = require('mongoose');
const { Schema } = mongoose;

const TaskSchema = new Schema({
  type: {
    type: String,
    enum: ['Lecture', 'Homework', 'Labs', 'Test'],
    required: true,
  },
  taskNumber: Number,
  name: { type: String, required: true },
  description: { type: String, required: true },
  taskFiles: String,
  reports: [
    {
      reportsNames: String,
      uid: String,
    },
  ],
  taskDate: { type: String, required: true },
  beginningTime: { type: String, required: true },
  endingTime: { type: String, required: true },
  settings: {
    autoReview: Boolean,
    graded: Boolean,
    freeMove: Boolean,
    canEnd: { type: Boolean, required: true },
    testDuration: Number,
    gradePercentages: [Number],
  },
  testConfig: {
    questions: [
      {
        position: Number,
        question: String,
        type: {
          type: String,
          enum: ['С несколькими вариантами', 'С одним вариантом', 'Текстовый'],
        },
        answers: [String],
        rightAnswer: String,
        weight: { type: Number, default: 1 },
      },
    ],
    testState: { type: String, enum: ['Draft', 'Submitted'] },
  },
  available: { type: Boolean, required: true },
  class: { type: String, required: true },
});

const TaskModel = mongoose.model('Tasks', TaskSchema);

module.exports = TaskModel;
