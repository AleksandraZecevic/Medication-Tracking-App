const express = require('express');
const cors = require('cors');

require('dotenv').config();
const DB = require('./db/connection.js'); 

const app = express();
const PORT = process.env.PORT || 2004;

app.use(cors());
app.use(express.json());

//routes
const medication = require("./routes/medication");
const userRoutes = require("./routes/user");
const donationCenter = require("./routes/donationcenter");
const caregiver = require("./routes/caregiver");
const healthcareWorker = require("./routes/healthcareWorker");
const medEntry = require("./routes/medicatonEntry.js");

app.use('/medication', medication);
app.use('/user', userRoutes);
app.use('/donationcenter', donationCenter);
app.use('/caregiver', caregiver);
app.use('/healthcareWorker', healthcareWorker);
app.use('/medentry', medEntry);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
