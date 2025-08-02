const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

db.connect((err) => {
  if (err) {
    console.error('Database connection failed: ', err.stack);
    return;
  }
  console.log('Connected to database.');
});

let dataPool = {};

// USER -----------------------------------------------------------------------------------------------------------
// USER -----------------------------------------------------------------------------------------------------------

dataPool.getAllUsers = () => {
  return new Promise((resolve, reject) => {
    db.query('SELECT * FROM User', (err, res) => {
      if (err) return reject(err);
      resolve(res);
    });
  });
};

dataPool.getUserById = (id) => {
  return new Promise((resolve, reject) => {
    db.query('SELECT * FROM User WHERE user_id = ?', [id], (err, res) => {
      if (err) return reject(err);
      resolve(res[0]);
    });
  });
};

dataPool.createUser = (user) => {
  const { user_id, name, lastname, email, password, role, language_pref } = user;

  if (!user_id || isNaN(user_id)) {
    return Promise.reject(new Error("user_id must be a valid number"));
  }

  return new Promise((resolve, reject) => {
    // Step 1: Check if user_id already exists
    db.query('SELECT user_id FROM User WHERE user_id = ?', [user_id], (err, results) => {
      if (err) return reject(err);

      if (results.length > 0) {
        return reject(new Error(`User with ID ${user_id} already exists.`));
      }

      // Step 2: Proceed with insertion
      db.query(
        'INSERT INTO User (user_id, name, lastname, email, password, role, language_pref) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [user_id, name, lastname, email, password, role, language_pref],
        (err) => {
          if (err) return reject(err);
          resolve({ id: user_id, ...user });
        }
      );
    });
  });
};


dataPool.updateUser = (id, user) => {
  const { name, lastname, email, password, role, language_pref } = user;
  return new Promise((resolve, reject) => {
    db.query(
      'UPDATE User SET name = ?, lastname = ?, email = ?, password = ?, role = ?, language_pref = ? WHERE user_id = ?',
      [name, lastname, email, password, role, language_pref, id],
      (err) => {
        if (err) return reject(err);
        resolve({ id, ...user });
      }
    );
  });
};

dataPool.deleteUser = (id) => {
  return new Promise((resolve, reject) => {
    db.query('DELETE FROM User WHERE user_id = ?', [id], (err) => {
      if (err) return reject(err);
      resolve({ message: 'User deleted successfully.' });
    });
  });
};

// MEDICATION ------------------------------------------------------------------------------------------------------
// MEDICATION ------------------------------------------------------------------------------------------------------

dataPool.allMedication = () => {
  return new Promise((resolve, reject) => {
    db.query('SELECT * FROM Medication', (err, res) => {
      if (err) {
        return reject(err);
      }
      return resolve(res);
    });
  });
};

dataPool.createMedication = (medication) => {
  const { med_id, name, type, intake_instruction } = medication;

  return new Promise((resolve, reject) => {
    if (med_id === undefined || med_id === null || isNaN(Number(med_id)) || !Number.isInteger(Number(med_id))) {
      return reject(new Error("med_id must be a valid integer"));
    }

    // Check for duplicate med_id
    db.query('SELECT med_id FROM Medication WHERE med_id = ?', [med_id], (err, results) => {
      if (err) return reject(err);
      if (results.length > 0) {
        return reject(new Error("Medication ID already exists"));
      }

      db.query(
        'INSERT INTO Medication (med_id, name, type, intake_instruction) VALUES (?, ?, ?, ?)',
        [med_id, name, type, intake_instruction],
        (err) => {
          if (err) return reject(err);
          resolve({ med_id, name, type, intake_instruction });
        }
      );
    });
  });
};

dataPool.getMedicationById = (id) => {
  return new Promise((resolve, reject) => {
    db.query('SELECT * FROM Medication WHERE med_id = ?', [id], (err, res) => {
      if (err) return reject(err);
      resolve(res[0]);
    });
  });
};

dataPool.updateMedication = (id, medication) => {
  if (!medication || typeof medication !== "object") {
    return Promise.reject(new Error("Invalid medication data"));
  }
  const { name, type, intake_instruction } = medication;

  return new Promise((resolve, reject) => {
     db.query(
      'UPDATE Medication SET name = ?, type = ?, intake_instruction = ? WHERE med_id = ?',
      [name, type, intake_instruction, id],
      (err, res) => {
        if (err) return reject(err);
        resolve(res);
      }
    );
  });
};

dataPool.deleteMedication = (id) => {
  return new Promise((resolve, reject) => {
    db.query('DELETE FROM Medication WHERE med_id = ?', [id], (err, res) => {
      if (err) return reject(err);
      resolve(res);
    });
  });
};

// CAREGIVER --------------------------------------------------------------------------------------------------
// CAREGIVER --------------------------------------------------------------------------------------------------
dataPool.createCaregiver = ({ user_id, certification, care_center_name }) => {
  return new Promise((resolve, reject) => {
    db.query(
      'INSERT INTO Caregiver (user_id, certification, care_center_name) VALUES (?, ?, ?)',
      [user_id, certification, care_center_name],
      (err, res) => {
        if (err) return reject(err);
        resolve({ user_id, certification, care_center_name });
      }
    );
  });
};

dataPool.getAllCaregivers = () => {
  return new Promise((resolve, reject) => {
    db.query('SELECT * FROM Caregiver', (err, res) => {
      if (err) {
        return reject(err);
      }
      return resolve(res);
    });
  });
};

// DONATION CENTER --------------------------------------------------------------------------------------------------
// DONATION CENTER --------------------------------------------------------------------------------------------------

dataPool.createDonationCenter = ({ user_id, center_name, address, verification_status }) => {
  return new Promise((resolve, reject) => {
    db.query(
      'INSERT INTO `Donation Center` (user_id, center_name, address, verification_status) VALUES (?, ?, ?, ?)',
      [user_id, center_name, address, verification_status],
      (err, res) => {
        if (err) return reject(err);
        resolve({ user_id, center_name, address, verification_status });
      }
    );
  });
};

dataPool.getAllDonationCenters = () => {
  return new Promise((resolve, reject) => {
    db.query('SELECT * FROM `Donation Center`', (err, res) => {
      if (err) {
        return reject(err);
      }
      return resolve(res);
    });
  });
};

// HEALTHCARE WORKER --------------------------------------------------------------------------------------------------
// HEALTHCARE WORKER --------------------------------------------------------------------------------------------------

dataPool.createHealthcareWorker = ({ user_id, licence_num, specialization, institution }) => {
  return new Promise((resolve, reject) => {
    db.query(
      'INSERT INTO `HealthCare Worker` (user_id, licence_num, specialization, institution) VALUES (?, ?, ?, ?)',
      [user_id, licence_num, specialization, institution],
      (err, res) => {
        if (err) return reject(err);
        resolve({ user_id, licence_num, specialization, institution });
      }
    );
  });
};

dataPool.getAllHealthCareWorkers = () => {
  return new Promise((resolve, reject) => {
    db.query('SELECT * FROM `HealthCare Worker`', (err, res) => {
      if (err) {
        return reject(err);
      }
      return resolve(res);
    });
  });
};


module.exports = dataPool;
