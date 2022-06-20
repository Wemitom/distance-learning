const mongoose = require('mongoose');
const { Schema } = mongoose;

const GradeSchema = new Schema({
  taskId: { type: String, required: true },
  type: { type: String, required: true },
  name: { type: String, required: true },
  uid: { type: String, required: true },
  class: { type: String, required: true },
  grade: { type: Number, min: 0, max: 5 },
  note: String,
});

const GradeModel = mongoose.model('Grades', GradeSchema);

module.exports = GradeModel;
