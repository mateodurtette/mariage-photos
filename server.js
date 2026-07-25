const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const path = require('path');

const app = express();
const upload = multer({ dest: 'uploads/' });

// Configuration de Cloudinary (via les variables d'environnement sur Render)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Service des fichiers statiques (ex: index.html, logo.png, etc.)
app.use(express.static(__dirname));
app.use(express.json());

// -------------------------------------------------------------
// 1. ROUTE POUR ENVOYER UNE PHOTO VERS CLOUDINARY
// -------------------------------------------------------------
app.post('/upload', upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Aucun fichier reçu.' });
    }

    const prenom = req.body.prenom || 'Anonyme';

    // Envoi de l'image vers le dossier "mariage-photos" sur Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'mariage-photos',
      tags: [prenom],
      context: { uploader: prenom }
    });

    res.json({ success: true, url: result.secure_url });
  } catch (error) {
    console.error('Erreur lors de l\'upload :', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// -------------------------------------------------------------
// 2. ROUTE POUR RÉCUPÉRER LES PHOTOS ET LES AFFICHER EN GALERIE
// -------------------------------------------------------------
app.get('/api/photos', async (req, res) => {
  try {
    const result = await cloudinary.search
      .expression('folder:mariage-photos')
      .sort_by('created_at', 'desc')
      .max_results(100)
      .execute();

    const imageUrls = result.resources.map(file => file.secure_url);

    res.json({ success: true, photos: imageUrls });
  } catch (error) {
    console.error('Erreur lors de la récupération des photos :', error);
    res.status(500).json({ success: false, error: 'Impossible de charger les photos.' });
  }
});

// Redirection par défaut vers index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Lancement du serveur sur le port attribué par Render
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
