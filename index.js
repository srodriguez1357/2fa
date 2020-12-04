const express = require('express');
const speakeasy = require('speakeasy');
const uuid = require('uuid');
const { JsonDB } = require('node-json-db');
const { Config } = require('node-json-db/dist/lib/JsonDBConfig'); 

const app = express();

app.use(express.json());

const db = new JsonDB(new Config('myDatabase', true, false, '/'));

app.get('/',(req, res) =>{
  res.sendFile('index.html', {root: __dirname});
});

app.get('/api', (req, res)=> res.json({message: 'Welcome to 2FA'}));

app.post('/api/register', (req, res)=> {
    const id = uuid.v4();
    try{
        const path = `/user/${id}`;
        const temp_secret = speakeasy.generateSecret();
        db.push(path, {id, temp_secret});
        res.json({id, secret: temp_secret.base32});

    }
    catch(error){
        console.log(error);
        res.status(500).json({message: 'Error generating secret'});
    }
})

app.post("/api/verify", (req,res) => {
    const { userId, token } = req.body;
    try {
      const path = `/user/${userId}`;
      const user = db.getData(path);
      console.log({ user })
      const { base32: secret } = user.temp_secret;
      const verified = speakeasy.totp.verify({
        secret,
        encoding: 'base32',
        token
      });
      if (verified) {
        db.push(path, { id: userId, secret: user.temp_secret });
        res.json({ verified: true })
      } else {
        res.json({ verified: false})
      }
    } catch(error) {
      console.error(error);
      res.status(500).json({ message: 'Error retrieving user'})
    };
  });
  
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>   console.log(`App is running on PORT: ${PORT}.`));