const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Configuration de Cloudinary avec les variables d'environnement
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Stockage temporaire en mémoire RAM (indispensable pour Render)
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 15 * 1024 * 1024 } // Limite à 15 Mo par photo
});

// Servir les fichiers statiques HTML/CSS
app.use(express.static('public'));
app.use(express.json());

// Endpoint pour recevoir la photo
app.post('/upload', upload.single('photo'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Aucune image envoyée.' });
  }

  const prenom = req.body.prenom ? req.body.prenom.trim() : 'Anonyme';

  // Upload du buffer mémoire vers Cloudinary
  const uploadStream = cloudinary.uploader.upload_stream(
    {
      folder: 'mariage_photos', // Nom du dossier dans Cloudinary
      tags: [prenom] // Tag avec le prénom de l'invité
    },
    (error, result) => {
      if (error) {
        console.error('Erreur Cloudinary:', error);
        return res.status(500).json({ error: 'Échec de l\'envoi de l\'image.' });
      }
      res.json({ success: true, url: result.secure_url });
    }
  );

  uploadStream.end(req.file.buffer);
});

app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});