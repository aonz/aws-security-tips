const express = require('express');
const app = express();
const port = 80;

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
  console.log(`PARAMETER_STORE: ${process.env.PARAMETER_STORE}`);
  console.log(`SECRETS_MANAGER: ${process.env.SECRETS_MANAGER}`);
});
