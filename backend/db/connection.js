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

  // Helper: generic partial update pattern
  async function partialUpdate(getByIdFn, updateFn, id, newData) {
    const existing = await getByIdFn(id);
    if (!existing) throw new Error("Record not found");

    const merged = { ...existing, ...newData };
    return updateFn(id, merged);
  }

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

  dataPool.getMaxUserId = () => {
  return new Promise((resolve, reject) => {
    db.query('SELECT MAX(user_id) AS maxId FROM User', (err, results) => {
      if (err) return reject(err);
      resolve(results[0].maxId);
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

  dataPool.getUserByEmail = (email) => {
    return new Promise((resolve, reject) => {
      db.query('SELECT * FROM User WHERE email = ?', [email], (err, res) => {
        if (err) return reject(err);
        resolve(res[0]); // undefined if no user
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

      // Step 2: Check for existing email
      db.query('SELECT email FROM User WHERE email = ?', [email], (err, results) => {
        if (err) return reject(err);

        if (results.length > 0) {
          return reject(new Error(`Email ${email} is already registered.`));
        }

        // Step 3: Proceed with insertion
        db.query(
          'INSERT INTO User (user_id, name, lastname, email, password, role, language_pref) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [user_id, name, lastname, email, password, role, language_pref],
          (err) => {
            if (err) return reject(err);
            resolve({ id: user_id, ...user });
          }
        );
      }); // closes check email query
    }); // closes check user_id query
  }); // closes Promise
};


  dataPool.updateUser = async (id, user) => {
    return partialUpdate(
      dataPool.getUserById,
      (id, u) =>
        new Promise((resolve, reject) => {
          const { name, lastname, email, password, role, language_pref } = u;
          db.query(
            'UPDATE User SET name = ?, lastname = ?, email = ?, password = ?, role = ?, language_pref = ? WHERE user_id = ?',
            [name, lastname, email, password, role, language_pref, id],
            (err) => {
              if (err) return reject(err);
              resolve({ id, ...u });
            }
          );
        }),
      id,
      user
    );
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

dataPool.updateMedication = async (id, medication) => {
  if (!medication || typeof medication !== "object") {
    return Promise.reject(new Error("Invalid medication data"));
  }
  return partialUpdate(
    dataPool.getMedicationById,
    (id, m) =>
      new Promise((resolve, reject) => {
        const { name, type, intake_instruction } = m;
        db.query(
          'UPDATE Medication SET name = ?, type = ?, intake_instruction = ? WHERE med_id = ?',
          [name, type, intake_instruction, id],
          (err, res) => {
            if (err) return reject(err);
            resolve(res);
          }
        );
      }),
    id,
    medication
  );
};

dataPool.deleteMedication = (id) => {
  return new Promise((resolve, reject) => {
    db.query('DELETE FROM Medication WHERE med_id = ?', [id], (err, res) => {
      if (err) return reject(err);
      resolve(res);
    });
  });
};

dataPool.getMaxMedId = () => {
  return new Promise((resolve, reject) => {
    db.query('SELECT MAX(med_id) AS maxId FROM Medication', (err, results) => {
      if (err) return reject(err);
      resolve(results[0].maxId);
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

dataPool.getCaregiverById = (user_id) => {
  return new Promise((resolve, reject) => {
    db.query('SELECT * FROM Caregiver WHERE user_id = ?', [user_id], (err, res) => {
      if (err) return reject(err);
      resolve(res[0]);
    });
  });
};

dataPool.updateCaregiver = async ({ user_id, certification, care_center_name }) => {
  return partialUpdate(
    dataPool.getCaregiverById,
    (id, c) =>
      new Promise((resolve, reject) => {
        const { certification, care_center_name } = c;
        db.query(
          'UPDATE Caregiver SET certification = ?, care_center_name = ? WHERE user_id = ?',
          [certification, care_center_name, id],
          (err, res) => {
            if (err) return reject(err);
            resolve({ user_id: id, ...c });
          }
        );
      }),
    user_id,
    { certification, care_center_name }
  );
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

dataPool.getDonationCenterById = (user_id) => {
  return new Promise((resolve, reject) => {
    db.query('SELECT * FROM `Donation Center` WHERE user_id = ?', [user_id], (err, res) => {
      if (err) return reject(err);
      resolve(res[0]);
    });
  });
};

dataPool.updateDonationCenter = async ({ user_id, center_name, address, verification_status }) => {
  return partialUpdate(
    dataPool.getDonationCenterById,
    (id, d) =>
      new Promise((resolve, reject) => {
        const { center_name, address, verification_status } = d;
        db.query(
          'UPDATE `Donation Center` SET center_name = ?, address = ?, verification_status = ? WHERE user_id = ?',
          [center_name, address, verification_status, id],
          (err, res) => {
            if (err) return reject(err);
            resolve({ user_id: id, ...d });
          }
        );
      }),
    user_id,
    { center_name, address, verification_status }
  );
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

dataPool.getHealthCareWorkerById = (user_id) => {
  return new Promise((resolve, reject) => {
    db.query('SELECT * FROM `HealthCare Worker` WHERE user_id = ?', [user_id], (err, res) => {
      if (err) return reject(err);
      resolve(res[0]); 
    });
  });
};

dataPool.updateHealthcareWorker = async (id, worker) => {
  return partialUpdate(
    dataPool.getHealthCareWorkerById,
    (id, w) =>
      new Promise((resolve, reject) => {
        const { licence_num, specialization, institution } = w;
        db.query(
          'UPDATE `HealthCare Worker` SET licence_num = ?, specialization = ?, institution = ? WHERE user_id = ?',
          [licence_num, specialization, institution, id],
          (err, res) => {
            if (err) return reject(err);
            if (res.affectedRows === 0) {
              return reject(new Error("Healthcare worker not found or no changes made"));
            }
            resolve({ id, ...w });
          }
        );
      }),
    id,
    worker
  );
};

dataPool.healthcareWorkerLicenceExists = (licence_num, excludeUserId = null) => {
  return new Promise((resolve, reject) => {
    const query = excludeUserId
      ? 'SELECT * FROM `HealthCare Worker` WHERE licence_num = ? AND user_id != ?'
      : 'SELECT * FROM `HealthCare Worker` WHERE licence_num = ?';

    const params = excludeUserId ? [licence_num, excludeUserId] : [licence_num];

    db.query(query, params, (err, results) => {
      if (err) return reject(err);
      resolve(results.length > 0);
    });
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

dataPool.updateMedEntry = async (entry_id, medE) => {
  try {
    //Fetch existing entry
    const existing = await dataPool.getMediEntryById(entry_id);
    if (!existing) throw new Error("Medication Entry not found");

    // Merge existing with new data (partial update)
    const merged = { ...existing, ...medE };

    const { user_id, med_id, prescribed_by } = merged;

    if (![user_id, med_id, prescribed_by].every(id => Number.isInteger(Number(id)))) {
      throw new Error("user_id, med_id, and prescribed_by must be valid integers");
    }

    const checks = await Promise.all([
      new Promise((res, rej) =>
        db.query('SELECT user_id FROM User WHERE user_id = ?', [user_id], (e, r) =>
          e ? rej(e) : res(r.length > 0)
        )
      ),
      new Promise((res, rej) =>
        db.query('SELECT med_id FROM Medication WHERE med_id = ?', [med_id], (e, r) =>
          e ? rej(e) : res(r.length > 0)
        )
      ),
      new Promise((res, rej) =>
        db.query('SELECT user_id FROM `HealthCare Worker` WHERE user_id = ?', [prescribed_by], (e, r) =>
          e ? rej(e) : res(r.length > 0)
        )
      )
    ]);

    if (checks.includes(false)) {
      throw new Error("One or more referenced IDs do not exist (user_id, med_id, prescribed_by)");
    }

    // actual update
    return new Promise((resolve, reject) => {
      db.query(
        'UPDATE `Medication Entry` SET user_id = ?, med_id = ?, purchase_date = ?, expiration_date = ?, prescribed_by = ?, donation_status = ? WHERE entry_id = ?',
        [
          merged.user_id,
          merged.med_id,
          merged.purchase_date,
          merged.expiration_date,
          merged.prescribed_by,
          merged.donation_status,
          entry_id,
        ],
        (err, res) => {
          if (err) return reject(err);
          resolve({ entry_id, ...merged });
        }
      );
    });

  } catch (err) {
    return Promise.reject(err);
  }
};

dataPool.deleteMedication = (id) => {
  return new Promise((resolve, reject) => {
    db.query('DELETE FROM `Medication Entry` WHERE entry_id = ?', [id], (err, res) => {
      if (err) return reject(err);
      resolve(res);
    });
  });
};

dataPool.getMaxEntryId = () => {
  return new Promise((resolve, reject) => {
    db.query('SELECT MAX(entry_id) AS maxId FROM `Medication Entry`', (err, results) => {
      if (err) return reject(err);
      resolve(results[0].maxId);
    });
  });
};

// REMINDER -------------------------------------------------------------------------------------------------------------
// REMINDER -------------------------------------------------------------------------------------------------------------

dataPool.createReminder = ({ rem_id, entry_id, time, note }) => {
  return new Promise((resolve, reject) => {
    db.query(
      'INSERT INTO Reminder (rem_id, entry_id, time, note) VALUES (?, ?, ?, ?)',
      [rem_id, entry_id, time, note],
      (err) => {
        if (err) return reject(err);
        resolve({ rem_id, entry_id, time, note });
      }
    );
  });
};

dataPool.getAllReminders = () => {
  return new Promise((resolve, reject) => {
    db.query('SELECT * FROM Reminder', (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
};

dataPool.getNextRemId = () => {
  return new Promise((resolve, reject) => {
    db.query('SELECT MAX(rem_id) AS maxId FROM Reminder', (err, res) => {
      if (err) return reject(err);
      const maxId = res[0].maxId || 0;
      resolve(maxId + 1);
    });
  });
};

dataPool.getReminderById = (rem_id) => {
  return new Promise((resolve, reject) => {
    db.query('SELECT * FROM Reminder WHERE rem_id = ?', [rem_id], (err, res) => {
      if (err) return reject(err);
      resolve(res[0]);
    });
  });
};

dataPool.deleteReminder = (rem_id) => {
  return new Promise((resolve, reject) => {
    db.query('DELETE FROM Reminder WHERE rem_id = ?', [rem_id], (err) => {
      if (err) return reject(err);
      resolve({ message: 'Reminder deleted successfully', rem_id });
    });
  });
};

dataPool.updateReminder = async (rem_id, reminderData) => {
  return partialUpdate(
    dataPool.getReminderById,
    (id, r) =>
      new Promise((resolve, reject) => {
        const { entry_id, time, note } = r;
        db.query(
          'UPDATE Reminder SET entry_id = ?, time = ?, note = ? WHERE rem_id = ?',
          [entry_id, time, note, id],
          (err, res) => {
            if (err) return reject(err);
            resolve({ rem_id: id, ...r });
          }
        );
      }),
    rem_id,
    reminderData
  );
};

// INTAKE LOG -------------------------------------------------------------------------------------------------------------
// INTAKE LOG -------------------------------------------------------------------------------------------------------------

dataPool.createIntakeLog = ({ log_id, entry_id, timestamp }) => {
  return new Promise((resolve, reject) => {
    db.query(
      'INSERT INTO `IntakeLog` (log_id, entry_id, timestamp) VALUES (?, ?, ?)',
      [log_id, entry_id, timestamp],
      (err, res) => {
        if (err) return reject(err);
        resolve({ log_id, entry_id, timestamp });
      }
    );
  });
};

dataPool.getAllIntakeLogs = () => {
  return new Promise((resolve, reject) => {
    db.query('SELECT * FROM `IntakeLog`', (err, res) => {
      if (err) return reject(err);
      resolve(res);
    });
  });
};

dataPool.getNextLogId = () => {
  return new Promise((resolve, reject) => {
    db.query('SELECT MAX(log_id) AS maxId FROM `IntakeLog`', (err, res) => {
      if (err) return reject(err);
      const maxId = res[0].maxId || 0;
      resolve(maxId + 1);
    });
  });
};

dataPool.getIntakeLogById = (log_id) => {
  return new Promise((resolve, reject) => {
    db.query('SELECT * FROM `IntakeLog` WHERE log_id = ?', [log_id], (err, res) => {
      if (err) return reject(err);
      resolve(res[0]);
    });
  });
};

dataPool.updateIntakeLog = async (log_id, logData) => {
  return partialUpdate(
    dataPool.getIntakeLogById,
    (id, merged) =>
      new Promise((resolve, reject) => {
        const { entry_id, timestamp } = merged;
        db.query(
          'UPDATE `IntakeLog` SET entry_id = ?, timestamp = ? WHERE log_id = ?',
          [entry_id, timestamp, id],
          (err) => {
            if (err) return reject(err);
            resolve({ log_id: id, ...merged });
          }
        );
      }),
    log_id,
    logData
  );
};

dataPool.deleteIntakeLog = (log_id) => {
  return new Promise((resolve, reject) => {
    db.query('DELETE FROM `IntakeLog` WHERE log_id = ?', [log_id], (err, res) => {
      if (err) return reject(err);
      resolve({ message: 'IntakeLog deleted successfully', log_id });
    });
  });
};

// SIDE EFFECT -------------------------------------------------------------------------------------------------------------
// SIDE EFFECT -------------------------------------------------------------------------------------------------------------

dataPool.getSideEffectById = (id) => {
  return new Promise((resolve, reject) => {
    db.query('SELECT * FROM `Side Effect` WHERE se_id = ?', [id], (err, res) => {
      if (err) return reject(err);
      resolve(res[0]);
    });
  });
};

dataPool.allSideEffects = () => {
  return new Promise((resolve, reject) => {
    db.query('SELECT * FROM `Side Effect`', (err, res) => {
      if (err) return reject(err);
      resolve(res);
    });
  });
};

dataPool.getMaxSEId = () => {
  return new Promise((resolve, reject) => {
    db.query('SELECT MAX(se_id) AS maxId FROM `Side Effect`', (err, results) => {
      if (err) return reject(err);
      resolve(results[0].maxId);
    });
  });
};

dataPool.createSideEffect = ({ se_id, entry_id, description }) => {
  return new Promise((resolve, reject) => {
    db.query(
      'INSERT INTO `Side Effect` (se_id, entry_id, description) VALUES (?, ?, ?)',
      [se_id, entry_id, description],
      (err) => {
        if (err) return reject(err);
        resolve({ se_id, entry_id, description });
      }
    );
  });
};

dataPool.updateSideEffect = async (se_id, data) => {
  return partialUpdate(
    dataPool.getSideEffectById,
    (id, merged) =>
      new Promise((resolve, reject) => {
        const { entry_id, description } = merged;
        db.query(
          'UPDATE `Side Effect` SET entry_id = ?, description = ? WHERE se_id = ?',
          [entry_id, description, id],
          (err) => {
            if (err) return reject(err);
            resolve({ se_id: id, ...merged });
          }
        );
      }),
    se_id,
    data
  );
};

dataPool.deleteSideEffect = (id) => {
  return new Promise((resolve, reject) => {
    db.query('DELETE FROM `Side Effect` WHERE se_id = ?', [id], (err) => {
      if (err) return reject(err);
      resolve({ message: 'SideEffect deleted', se_id: id });
    });
  });
};

// DONATION REQUEST -------------------------------------------------------------------------------------------------------------
// DONATION REQUEST -------------------------------------------------------------------------------------------------------------

dataPool.isDonationCenterUser = (center_id) => {
  return new Promise((resolve, reject) => {
    db.query(
      'SELECT role FROM User WHERE user_id = ? AND role = "donation center"',
      [center_id],
      (err, result) => {
        if (err) return reject(err);
        resolve(result.length > 0); // true if found
      }
    );
  });
};


dataPool.createDonationRequest = async ({ dreq_id, entry_id, center_id, status }) => {
  // validate center_id is a valid user with role "donation center"
  const isValidCenter = await dataPool.isDonationCenterUser(center_id);
  if (!isValidCenter) {
    throw new Error("center_id must belong to a user with role 'donation center'");
  }

  return new Promise((resolve, reject) => {
    db.query(
      'INSERT INTO `Donation Request` (dreq_id, entry_id, center_id, status) VALUES (?, ?, ?, ?)',
      [dreq_id, entry_id, center_id, status],
      (err, res) => {
        if (err) return reject(err);
        resolve({ dreq_id, entry_id, center_id, status });
      }
    );
  });
};

dataPool.getAllDonationRequests = () => {
  return new Promise((resolve, reject) => {
    db.query('SELECT * FROM `Donation Request`', (err, res) => {
      if (err) return reject(err);
      resolve(res);
    });
  });
};

dataPool.getDonationRequestById = (id) => {
  return new Promise((resolve, reject) => {
    db.query('SELECT * FROM `Donation Request` WHERE dreq_id = ?', [id], (err, res) => {
      if (err) return reject(err);
      resolve(res[0]);
    });
  });
};

dataPool.updateDonationRequest = async (id, data) => {
  // First get the existing record and merge with new data
  const existing = await dataPool.getDonationRequestById(id);
  if (!existing) throw new Error("Donation request not found");

  const merged = { ...existing, ...data };
  const { entry_id, center_id, status } = merged;

  // Validate center_id before going into DB query
  const isValidCenter = await dataPool.isDonationCenterUser(center_id);
  if (!isValidCenter) {
    throw new Error("center_id must belong to a user with role 'donation center'");
  }

  // Now perform update
  return new Promise((resolve, reject) => {
    db.query(
      'UPDATE `Donation Request` SET entry_id = ?, center_id = ?, status = ? WHERE dreq_id = ?',
      [entry_id, center_id, status, id],
      (err) => {
        if (err) return reject(err);
        resolve({ dreq_id: id, ...merged });
      }
    );
  });
};

dataPool.deleteDonationRequest = (id) => {
  return new Promise((resolve, reject) => {
    db.query('DELETE FROM `Donation Request` WHERE dreq_id = ?', [id], (err) => {
      if (err) return reject(err);
      resolve({ message: "Donation Request deleted", dreq_id: id });
    });
  });
};

module.exports = dataPool;
