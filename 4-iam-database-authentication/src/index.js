const mysql = require('mysql2/promise');
const AWS = require('aws-sdk');

AWS.config.logger = console;

let connection;

async function init() {
  const signer = new AWS.RDS.Signer({
    region: process.env.AWS_REGION,
    hostname: process.env.DB_HOSTNAME,
    port: 3306,
    username: 'default',
  });
  // Generating an auth token synchronously.
  // https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/RDS/Signer.html#getAuthToken-property
  const token = signer.getAuthToken({ username: 'user' });
  console.log(`Token: ${token}`);
  try {
    connection = await mysql.createConnection({
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
    console.log('DB connection created.');
  } catch (error) {
    console.log('Failed to create DB connection.');
    console.log(error);
  }
}

const initPromise = init();

exports.handler = async function (event, context) {
  await initPromise;
  // Safeguard when using Lambda Provisioned Concurrency
  if (!connection) {
    console.log('Call init(); again.');
    await init();
  }
  try {
    const [rows, fields] = await connection.execute('SELECT 1;');
    console.log(`Rows: ${JSON.stringify(rows)}`);
  } catch (error) {
    console.log(error);
  }
  return {};
};
