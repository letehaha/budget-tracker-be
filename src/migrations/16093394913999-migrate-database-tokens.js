
const CryptoJS = require('crypto-js');
const ENCRYPTION_SECRET = process.env.DATA_ENCRYPTION_SECRET;


const encryptData = (data) => {
  const stringifiedData = JSON.stringify(data);
  return CryptoJS.AES.encrypt(stringifiedData, ENCRYPTION_SECRET).toString();
};

const decryptData = (encryptedData) => {
  const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_SECRET);
  const decryptedData = bytes.toString(CryptoJS.enc.Utf8);

  try {
    return JSON.parse(decryptedData);
  } catch (error) {
    throw new Error('Failed to parse decrypted data. Ensure the data is properly encrypted and formatted.');
  }
};


module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log("Start migration")

    try {
      const users = await queryInterface.sequelize.query(
        `SELECT id, apiToken FROM "MonobankUsers" WHERE apiToken IS NOT NULL;`,
        { type: Sequelize.QueryTypes.SELECT }
      );

      if (!users.length) {
        //No api token to encrypt
        return;
      }

      for (const { id, apiToken } of users) {
        try {
          const encryptedToken = encryptData(apiToken);

          await queryInterface.sequelize.query(
            `UPDATE "MonobankUsers" SET apiToken = :encryptedToken WHERE id = :id;`,
            {
              replacements: { encryptedToken, id },
              type: Sequelize.QueryTypes.UPDATE,
            }
          );

          //Api token encryption is success
        } catch (error) {
          console.error(`Failed to encrypt API token for user ID ${id}:`, error);
        }
      }

      //Migration api token encrypt is complete
    } catch (error) {
      console.error('Migration failed:', error);
    }
  },

  down: async (queryInterface, Sequelize) => {
    //Rollback encrypting
    console.log("Rollback token migration")
    try {
      const users = await queryInterface.sequelize.query(
        `SELECT id, apiToken FROM "MonobankUsers" WHERE apiToken IS NOT NULL;`,
        { type: Sequelize.QueryTypes.SELECT }
      );

      if (!users.length) {
        //No api token to decrypt
        return;
      }

      for (const { id, apiToken } of users) {
        try {
          const decryptedToken = decryptData(apiToken);

          await queryInterface.sequelize.query(
            `UPDATE "MonobankUsers" SET apiToken = :decryptedToken WHERE id = :id;`,
            {
              replacements: { decryptedToken, id },
              type: Sequelize.QueryTypes.UPDATE,
            }
          );

          //Api token successfully decrypt
        } catch (error) {
          console.error(`Failed to decrypt API token for user ID ${id}:`, error);
        }
      }

      //Rollback completed
    } catch (error) {
      console.error('Rollback failed:', error);
    }
  },
};