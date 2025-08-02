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

dataPool.updateCaregiver = ({ user_id, certification, care_center_name }) => {
  return new Promise((resolve, reject) => {
    db.query(
      'UPDATE Caregiver SET certification = ?, care_center_name = ? WHERE user_id = ?',
      [certification, care_center_name, user_id],
      (err, res) => {
        if (err) return reject(err);
        resolve({ user_id, certification, care_center_name });
      }
    );
  });
};

dataPool.deleteCaregiver = (user_id) => {
  return new Promise((resolve, reject) => {
    db.query('DELETE FROM Caregiver WHERE user_id = ?', [user_id], (err, res) => {
      if (err) return reject(err);
      resolve({ message: 'Caregiver deleted successfully.', user_id });
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

dataPool.updateDonationCenter = ({ user_id, center_name, address, verification_status }) => {
  return new Promise((resolve, reject) => {
    db.query(
      'UPDATE `Donation Center` SET center_name = ?, address = ?, verification_status = ? WHERE user_id = ?',
      [center_name, address, verification_status, user_id],
      (err, res) => {
        if (err) return reject(err);
        resolve({ user_id, center_name, address, verification_status });
      }
    );
  });
};


dataPool.deleteDonationCenter = (user_id) => {
  return new Promise((resolve, reject) => {
    db.query('DELETE FROM `Donation Center` WHERE user_id = ?', [user_id], (err, res) => {
      if (err) return reject(err);
      resolve({ message: 'Donation Center deleted successfully.', user_id });
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

dataPool.updateHealthcareWorker = ({ user_id, licence_num, specialization, institution }) => {
  return new Promise((resolve, reject) => {
    db.query(
      'UPDATE `HealthCare Worker` SET licence_num = ?, specialization = ?, institution = ? WHERE user_id = ?',
      [licence_num, specialization, institution, user_id],
      (err, res) => {
        if (err) return reject(err);
        resolve({ user_id, licence_num, specialization, institution });
      }
    );
  });
};

// Delete HealthCare Worker by user_id
dataPool.deleteHealthcareWorker = (user_id) => {
  return new Promise((resolve, reject) => {
    db.query('DELETE FROM `HealthCare Worker` WHERE user_id = ?', [user_id], (err, res) => {
      if (err) return reject(err);
      resolve({ message: 'HealthCare Worker deleted successfully.', user_id });
    });
  });
};

// MEDICATION ENTRY ------------------------------------------------------------------------------------------------------
// MEDICATION ENTRY ------------------------------------------------------------------------------------------------------

dataPool.allMediEntry = () => {
  return new Promise((resolve, reject) => {
    db.query('SELECT * FROM `Medication Entry`', (err, res) => {
      if (err) {
        return reject(err);
      }
      return resolve(res);
    });
  });
};

dataPool.createMedEntry = (medE) => {
  const { entry_id, user_id, med_id, purchase_date, expiration_date, prescribed_by, donation_status } = medE;

  return new Promise(async (resolve, reject) => {
    try {
      if (![user_id, med_id, prescribed_by].every(id => Number.isInteger(Number(id)))) {
        return reject(new Error("user_id, med_id, and prescribed_by must be valid integers"));
      }

      const checks = await Promise.all([
        new Promise((res, rej) => db.query('SELECT user_id FROM User WHERE user_id = ?', [user_id], (e, r) => e ? rej(e) : res(r.length > 0))),
        new Promise((res, rej) => db.query('SELECT med_id FROM Medication WHERE med_id = ?', [med_id], (e, r) => e ? rej(e) : res(r.length > 0))),
        new Promise((res, rej) => db.query('SELECT user_id FROM `HealthCare Worker` WHERE user_id = ?', [prescribed_by], (e, r) => e ? rej(e) : res(r.length > 0)))
      ]);

      if (checks.includes(false)) {
        return reject(new Error("One or more referenced IDs do not exist (user_id, med_id, prescribed_by)"));
      }

      db.query(
        'INSERT INTO `Medication Entry` (entry_id, user_id, med_id, purchase_date, expiration_date, prescribed_by, donation_status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [entry_id, user_id, med_id, purchase_date, expiration_date, prescribed_by, donation_status],
        (err) => {
          if (err) return reject(err);
          resolve({ entry_id, user_id, med_id });
        }
      );
    } catch (err) {
      reject(err);
    }
  });
};


dataPool.getMediEntryById = (id) => {
  return new Promise((resolve, reject) => {
    db.query('SELECT * FROM `Medication Entry` WHERE entry_id = ?', [id], (err, res) => {
      if (err) return reject(err);
      resolve(res[0]);
    });
  });
};

dataPool.updateMedEntry = (entry_id, medE) => {
  const { user_id, med_id, purchase_date, expiration_date, prescribed_by, donation_status } = medE;

  return new Promise(async (resolve, reject) => {
    try {
      if (![user_id, med_id, prescribed_by].every(id => Number.isInteger(Number(id)))) {
        return reject(new Error("user_id, med_id, and prescribed_by must be valid integers"));
      }

      const checks = await Promise.all([
        new Promise((res, rej) => db.query('SELECT user_id FROM User WHERE user_id = ?', [user_id], (e, r) => e ? rej(e) : res(r.length > 0))),
        new Promise((res, rej) => db.query('SELECT med_id FROM Medication WHERE med_id = ?', [med_id], (e, r) => e ? rej(e) : res(r.length > 0))),
        new Promise((res, rej) => db.query('SELECT user_id FROM `HealthCare Worker` WHERE user_id = ?', [prescribed_by], (e, r) => e ? rej(e) : res(r.length > 0)))
      ]);

      if (checks.includes(false)) {
        return reject(new Error("One or more referenced IDs do not exist (user_id, med_id, prescribed_by)"));
      }

      db.query(
        'UPDATE `Medication Entry` SET user_id = ?, med_id = ?, purchase_date = ?, expiration_date = ?, prescribed_by = ?, donation_status = ? WHERE entry_id = ?',
        [user_id, med_id, purchase_date, expiration_date, prescribed_by, donation_status, entry_id],
        (err, res) => {
          if (err) return reject(err);
          resolve(res);
        }
      );
    } catch (err) {
      reject(err);
    }
  });
};


dataPool.deleteMedication = (id) => {
  return new Promise((resolve, reject) => {
    db.query('DELETE FROM `Medication Entry` WHERE entry_id = ?', [id], (err, res) => {
      if (err) return reject(err);
      resolve(res);
    });
  });
};


module.exports = dataPool;
