require('dotenv').config()
const axios = require('axios');


const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt')
const cors = require('cors');

const multer = require('multer');
const upload = multer({ dest: "uploads/" });

var express = require('express');

var app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());
app.use(express.static('public'));


const PORT = process.env.PORT || 3001;

app.listen(PORT, function () {
    console.log('Server running on port ' + PORT);
});

const conf = {
    host: process.env.DB_HOST,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    dateStrings: false,
    timezone: '+00:00'
}

//Verkkokaupan asiakaspalautteen lähettäminen tietokantaan

app.post('/contact', async (req, res) => {
    try {
      const formData = req.body;
  
      // Tietokantayhteys
      const connection = await mysql.createConnection(conf);
  
      // Tietokantaan tallentaminen ja SQL komennot.
      const [result] = await connection.execute(
        'INSERT INTO contact_form (name, email, message) VALUES (?, ?, ?)',
        [formData.name, formData.email, formData.message]
      );
  
      // Sulje tietokantayhteys
      connection.end();
  
      console.log('Tallennettu data:', formData);
      res.sendStatus(200);
      //Virheenkäsittely
    } catch (error) {
      console.error('Virhe lomakkeen tietojen tallennuksessa:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }

});

//Palautteiden haku tietokannasta ylläpitosivulle jossa voi lukea asiakapalautteita

app.get('/feedback', async (req, res) => {
    try {
        const connection = await mysql.createConnection(conf);

        // Hae kaikki asiakaspalautteet tietokannasta
        const [feedbackRows] = await connection.execute('SELECT * FROM contact_form');

        // Palauta asiakaspalautteet JSON-muodossa
        res.status(200).json(feedbackRows);

        //Virheenkäsittely
    } catch (error) {
        console.error('Virhe asiakaspalautteiden hakemisessa:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

//Asiakaspalautteiden poistaminen tietokannasta ylläpito-osiosta käsin
app.delete('/feedback/:id', async (req, res) => {
    try {
      // Luodaan tietokantayhteys
      const connection = await mysql.createConnection(conf);
      
      const id = parseInt(req.params.id);
  
      // SQL-kysely asiakaspalautteen poistamiseksi tietokannasta
      const sql = 'DELETE FROM contact_form WHERE id = ?';
  
      // Suoritetaan SQL-kysely
      const [results] = await connection.execute(sql, [id]);
  
      // Tarkistetaan, kuinka monta riviä poistettiin
      console.log('Poistettuja rivejä:', results.affectedRows);
      if (results.affectedRows === 0) {
        res.status(404).json({ error: 'Asiakaspalautetta ei löytynyt' });
      } else {
        res.status(204).send(); // Onnistunut, ei sisältöä
      }
  
      // Suljetaan tietokantayhteys
      connection.end();

      //Virheenkäsittely
    } catch (error) {
      console.error('Virhe asiakaspalautteen poistamisessa:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
  
