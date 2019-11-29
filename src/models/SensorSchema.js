// src/models/SensorSchema.js
const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const SensorSchema = new Schema(
  {
    fId: Number,
	sId: Number,
    type: String,
	  value: Number
  },
  { collection: "sensor_data" }
);
module.exports = Sensor = mongoose.model("Sensor", SensorSchema);
