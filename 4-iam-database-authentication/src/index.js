const mysql = require('mysql2/promise');
const AWS = require('aws-sdk');

exports.handler = async function (event, context) {
  try {
    const signer = new AWS.RDS.Signer();
    const token = await new Promise((resolve, reject) => {
      signer.getAuthToken(
        {
          region: process.env.AWS_REGION,
          hostname: process.env.DB_HOSTNAME,
          port: 3306,
          username: 'user',
        },
        (err, token) => {
          if (err) {
            reject(err);
          }
          resolve(token);
        }
      );
    });
    console.log(`Token: ${token}`);
    const connection = await mysql.createConnection({
      host: process.env.DB_HOSTNAME,
      port: 3306,
      user: 'user',
      password: token,
      database: 'demo',
      ssl: 'Amazon RDS',
      authPlugins: {
        mysql_clear_password: () => () => Buffer.from(token + '\0'),
      },
      Promise,
    });
    const [rows, fields] = await connection.execute('SELECT 1;');
    console.log(`Rows: ${JSON.stringify(rows)}`);
  } catch (error) {
    console.log(error);
  }
  return {};
};
