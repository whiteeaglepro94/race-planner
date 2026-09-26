import PDFDocument from 'pdfkit';
import { createWriteStream, mkdirSync } from 'fs';
import { dirname } from 'path';

const OUTPUT = process.argv[2] || 'Race Planner - Documentation.pdf';
mkdirSync(dirname(OUTPUT), { recursive: true });

const doc = new PDFDocument({ size: 'A4', margin: 50 });
doc.pipe(createWriteStream(OUTPUT));

const COLORS = {
  primary: '#1a73e8',
  dark: '#0d1117',
  text: '#24292f',
  muted: '#656d76',
  accent: '#f5a623',
  green: '#2ecc71',
  blue: '#3498db',
  yellow: '#f1c40f',
  purple: '#9b59b6',
  bg: '#f6f8fa',
};

function title(text, size = 24) {
  doc.fontSize(size).font('Helvetica-Bold').fillColor(COLORS.dark).text(text);
  doc.moveDown(0.3);
  doc.strokeColor(COLORS.primary).lineWidth(2)
    .moveTo(50, doc.y).lineTo(545, doc.y).stroke();
  doc.moveDown(0.8);
}

function heading(text, size = 16) {
  doc.moveDown(0.5);
  doc.fontSize(size).font('Helvetica-Bold').fillColor(COLORS.primary).text(text);
  doc.moveDown(0.4);
}

function subheading(text) {
  doc.moveDown(0.3);
  doc.fontSize(12).font('Helvetica-Bold').fillColor(COLORS.dark).text(text);
  doc.moveDown(0.2);
}

function body(text) {
  doc.fontSize(10).font('Helvetica').fillColor(COLORS.text).text(text, { lineGap: 3 });
  doc.moveDown(0.3);
}

function bullet(text) {
  doc.fontSize(10).font('Helvetica').fillColor(COLORS.text).text(`  •  ${text}`, { lineGap: 2, indent: 10 });
}

function note(text) {
  const x = 60;
  const y = doc.y;
  doc.rect(x - 5, y - 3, 490, 30).fill('#e8f4fd').stroke();
  doc.fontSize(9).font('Helvetica-Oblique').fillColor('#1a56a0').text(`💡 ${text}`, x, y + 3, { width: 475 });
  doc.moveDown(1.5);
}

function checkNewPage(needed = 120) {
  if (doc.y > 700 - needed) doc.addPage();
}

// ══════════════════════════════════════
// PAGE DE COUVERTURE
// ══════════════════════════════════════
doc.rect(0, 0, 595.28, 841.89).fill(COLORS.dark);

// Checkered flag decoration
const flagY = 180;
const cellSize = 18;
for (let row = 0; row < 4; row++) {
  for (let col = 0; col < 34; col++) {
    const isWhite = (row + col) % 2 === 0;
    doc.rect(col * cellSize, flagY + row * cellSize, cellSize, cellSize)
      .fill(isWhite ? '#ffffff' : COLORS.dark);
  }
}

doc.fontSize(48).font('Helvetica-Bold').fillColor('#ffffff')
  .text('Race Planner', 50, 310, { align: 'center' });

doc.fontSize(18).font('Helvetica').fillColor(COLORS.accent)
  .text('Application de Planning de Course d\'Endurance', 50, 380, { align: 'center' });

doc.fontSize(13).font('Helvetica').fillColor('#8b949e')
  .text('iRacing  •  Le Mans Ultimate  •  Simulations Automobiles', 50, 430, { align: 'center' });

doc.fontSize(11).fillColor('#6e7681')
  .text('Documentation Utilisateur — v1.0', 50, 500, { align: 'center' });

doc.fontSize(10).fillColor('#484f58')
  .text('Septembre 2026', 50, 530, { align: 'center' });

// Bottom decoration
for (let row = 0; row < 3; row++) {
  for (let col = 0; col < 34; col++) {
    const isWhite = (row + col) % 2 === 0;
    doc.rect(col * cellSize, 770 + row * cellSize, cellSize, cellSize)
      .fill(isWhite ? '#ffffff' : COLORS.dark);
  }
}

// ══════════════════════════════════════
// TABLE DES MATIÈRES
// ══════════════════════════════════════
doc.addPage();
title('Table des Matières');
doc.moveDown(0.5);

const toc = [
  ['1.', 'Présentation générale', '3'],
  ['2.', 'Interface utilisateur', '4'],
  ['3.', 'Configuration de la course', '5'],
  ['4.', 'Gestion des pilotes', '6'],
  ['5.', 'Gestion des relais (stints)', '7'],
  ['6.', 'Arrêts aux stands (pit stops)', '8'],
  ['7.', 'Connexion iRacing en temps réel', '9'],
  ['8.', 'Détection automatique des pit stops', '10'],
  ['9.', 'Frise chronologique (Timeline)', '11'],
  ['10.', 'Export et sauvegarde', '12'],
  ['11.', 'Raccourcis clavier', '13'],
  ['12.', 'Architecture technique', '14'],
];

for (const [num, label, page] of toc) {
  const y = doc.y;
  doc.fontSize(11).font('Helvetica-Bold').fillColor(COLORS.primary).text(num, 60, y, { continued: false });
  doc.fontSize(11).font('Helvetica').fillColor(COLORS.text).text(label, 85, y);
  doc.fontSize(10).font('Helvetica').fillColor(COLORS.muted).text(page, 520, y, { width: 30, align: 'right' });
  doc.moveDown(0.6);
}

// ══════════════════════════════════════
// 1. PRÉSENTATION GÉNÉRALE
// ══════════════════════════════════════
doc.addPage();
title('1. Présentation Générale');

body('Race Planner est une application de bureau conçue pour planifier et suivre en temps réel les courses d\'endurance en simulation automobile (iRacing, Le Mans Ultimate, et autres simulateurs).');

body('L\'application permet de :');
bullet('Planifier les relais de chaque pilote sur une frise chronologique visuelle');
bullet('Gérer le carburant, les pneus et les arrêts aux stands');
bullet('Se connecter à iRacing pour suivre la course en direct');
bullet('Détecter automatiquement les passages aux stands et mettre à jour le plan');
bullet('Exporter le planning en PDF, CSV ou image');
doc.moveDown(0.5);

heading('Pourquoi Race Planner ?');
body('En course d\'endurance (6h, 12h, 24h), la stratégie est déterminante. Race Planner offre une vue d\'ensemble claire de toute la course, permettant à l\'équipe de :');
bullet('Répartir équitablement le temps de pilotage entre les pilotes');
bullet('Anticiper les arrêts aux stands en fonction du carburant');
bullet('Adapter la stratégie en temps réel grâce à la connexion iRacing');
bullet('Visualiser les transitions jour/nuit pour adapter les relais');

doc.moveDown(0.5);
heading('Simulateurs supportés');
body('Race Planner fonctionne avec tout simulateur disposant d\'une fonction de partage de télémétrie :');
bullet('iRacing — connexion en temps réel via télémétrie partagée');
bullet('Le Mans Ultimate — planification manuelle');
bullet('Assetto Corsa Competizione — planification manuelle');
bullet('rFactor 2 — planification manuelle');

// ══════════════════════════════════════
// 2. INTERFACE UTILISATEUR
// ══════════════════════════════════════
doc.addPage();
title('2. Interface Utilisateur');

body('L\'interface est organisée en zones distinctes pour un accès rapide à toutes les fonctionnalités :');
doc.moveDown(0.3);

subheading('Barre supérieure (TopBar)');
body('Affiche le nom de l\'écurie et du championnat, tous deux éditables en cliquant dessus. Le nom de l\'écurie s\'affiche en gris, le championnat en blanc, séparés par un chevron (›).');

subheading('Barre d\'outils (ToolBar)');
body('Contient les boutons principaux : Sauvegarder, Exporter (PDF/CSV), Annuler/Rétablir (undo/redo), et les toggles d\'affichage des icônes pneus et carburant sur la frise.');

subheading('Frise chronologique (Timeline)');
body('La zone principale de l\'application. Affiche les relais sous forme de blocs colorés par pilote sur un axe temporel. Permet le zoom (molette), le défilement (clic-glisser), et la sélection de stints (clic).');

subheading('Barre d\'information (InfoBar)');
body('Affiche les statistiques de la course : durée totale, nombre de stints, nombre de pilotes, et le résumé du temps par pilote.');

subheading('Panneau de détail (StintDetailPanel)');
body('Apparaît lorsqu\'un stint est sélectionné. Permet de modifier les paramètres du relai : pilote, horaires, pneus, carburant, notes.');

subheading('Panneau Live (LivePanel)');
body('Gère la connexion à iRacing. Affiche les données de télémétrie en temps réel : position, tour, carburant, temps au tour.');

subheading('Barre de statut (StatusBar)');
body('En bas de l\'écran, affiche l\'état de la connexion WebSocket et les alertes en cours.');

// ══════════════════════════════════════
// 3. CONFIGURATION DE LA COURSE
// ══════════════════════════════════════
doc.addPage();
title('3. Configuration de la Course');

body('La configuration de la course définit les paramètres globaux qui affectent tous les calculs de stratégie.');
doc.moveDown(0.3);

subheading('Paramètres généraux');
const configParams = [
  ['Nom de l\'écurie', 'Le nom de votre équipe (ex: "Racing 42")'],
  ['Championnat', 'Le nom de la compétition (ex: "24 Heures du Mans")'],
  ['Simulateur', 'Le logiciel utilisé (iRacing, LMU, etc.)'],
  ['Circuit', 'Le nom du circuit (ex: "Circuit de la Sarthe")'],
  ['Voiture', 'Le modèle de voiture (ex: "Toyota TR010 Hybrid")'],
  ['Durée de course', 'En minutes (1440 = 24h, 360 = 6h)'],
  ['Heure de départ', 'Format HH:MM (ex: 16:00)'],
];

for (const [param, desc] of configParams) {
  checkNewPage(30);
  doc.fontSize(10).font('Helvetica-Bold').fillColor(COLORS.dark).text(param, { continued: true });
  doc.font('Helvetica').fillColor(COLORS.muted).text(` — ${desc}`);
  doc.moveDown(0.15);
}

doc.moveDown(0.5);
subheading('Paramètres de stratégie');
const stratParams = [
  ['Durée d\'arrêt aux stands', 'Temps moyen d\'un pit stop en secondes (ex: 60s)'],
  ['Capacité réservoir', 'En litres (ex: 110L)'],
  ['Consommation par tour', 'En litres/tour (ex: 4.16L)'],
  ['Temps au tour moyen', 'En secondes (ex: 218.6s pour Le Mans)'],
];

for (const [param, desc] of stratParams) {
  checkNewPage(30);
  doc.fontSize(10).font('Helvetica-Bold').fillColor(COLORS.dark).text(param, { continued: true });
  doc.font('Helvetica').fillColor(COLORS.muted).text(` — ${desc}`);
  doc.moveDown(0.15);
}

doc.moveDown(0.5);
subheading('Indicateurs visuels');
body('L\'heure de coucher et lever du soleil permet d\'afficher des marqueurs visuels sur la frise, aidant à adapter les relais aux conditions de luminosité. Un drapeau à damier marque la fin de course avec l\'heure exacte affichée en doré.');

// ══════════════════════════════════════
// 4. GESTION DES PILOTES
// ══════════════════════════════════════
doc.addPage();
title('4. Gestion des Pilotes');

body('Chaque course nécessite une équipe de pilotes. Par défaut, Race Planner crée 4 pilotes avec des couleurs distinctes.');
doc.moveDown(0.3);

subheading('Propriétés d\'un pilote');
bullet('Nom — Le nom affiché sur la frise et dans les exports');
bullet('Couleur — Couleur unique pour identifier visuellement les relais du pilote');
bullet('Temps de conduite maximum (optionnel) — Limite en minutes, utile pour respecter les règlements');
doc.moveDown(0.5);

subheading('Couleurs par défaut');
body('Les 4 pilotes par défaut utilisent des couleurs facilement distinguables :');
bullet('Pilote 1 : Vert (#2ecc71)');
bullet('Pilote 2 : Bleu (#3498db)');
bullet('Pilote 3 : Jaune (#f1c40f)');
bullet('Pilote 4 : Violet (#9b59b6)');
doc.moveDown(0.5);

subheading('Ajouter / Supprimer un pilote');
body('Les pilotes peuvent être ajoutés ou supprimés depuis le panneau de gestion. Supprimer un pilote qui a des relais assignés ne supprime pas les relais, mais ils apparaîtront sans couleur assignée.');

doc.moveDown(0.5);
subheading('Temps de conduite');
body('Race Planner calcule automatiquement le temps total de conduite par pilote. Ce résumé est visible dans la barre d\'information et les exports PDF/CSV.');

// ══════════════════════════════════════
// 5. GESTION DES RELAIS
// ══════════════════════════════════════
doc.addPage();
title('5. Gestion des Relais (Stints)');

body('Les relais constituent le cœur du planning. Chaque relai représente une période de conduite continue d\'un pilote entre deux arrêts aux stands.');
doc.moveDown(0.3);

subheading('Propriétés d\'un relai');
const stintProps = [
  ['Pilote assigné', 'Le pilote qui conduit pendant ce relai'],
  ['Heure de début', 'Format HH:MM — l\'heure à laquelle le pilote prend la piste'],
  ['Heure de fin', 'Format HH:MM — l\'heure à laquelle le pilote rentre aux stands'],
  ['Durée', 'Calculée automatiquement en minutes'],
  ['Type de pneus', 'Sec (dry), Pluie (wet), ou Intermédiaire'],
  ['État des pneus', 'Neufs (new) ou Usagés (used)'],
  ['Nombre de pleins', 'Nombre de chargements de carburant (0 = pas de refuel)'],
  ['Verrouillé', 'Si activé, le relai n\'est pas modifié par les ajustements automatiques'],
  ['Notes', 'Texte libre pour annotations stratégiques'],
];

for (const [param, desc] of stintProps) {
  checkNewPage(30);
  doc.fontSize(10).font('Helvetica-Bold').fillColor(COLORS.dark).text(param, { continued: true });
  doc.font('Helvetica').fillColor(COLORS.muted).text(` — ${desc}`);
  doc.moveDown(0.15);
}

doc.moveDown(0.5);
subheading('Manipulation sur la frise');
body('Les relais sont affichés comme des blocs colorés sur la frise chronologique :');
bullet('Clic sur un bloc — Sélectionne le relai et ouvre le panneau de détail');
bullet('Glisser les bords — Ajuste la durée du relai (début ou fin)');
bullet('Le nom du pilote et la durée sont affichés directement sur chaque bloc');

doc.moveDown(0.5);
subheading('Génération automatique');
body('Au premier lancement, Race Planner génère automatiquement des relais de 90 minutes répartis entre les 4 pilotes par défaut, avec 1 minute d\'arrêt entre chaque relai.');

// ══════════════════════════════════════
// 6. ARRÊTS AUX STANDS
// ══════════════════════════════════════
doc.addPage();
title('6. Arrêts aux Stands (Pit Stops)');

body('Les pit stops sont les transitions entre deux relais. Ils représentent le temps passé dans la voie des stands pour le ravitaillement et/ou le changement de pneus.');
doc.moveDown(0.3);

subheading('Propriétés d\'un arrêt');
bullet('Après le relai — L\'identifiant du relai qui précède cet arrêt');
bullet('Heure — L\'heure exacte de l\'arrêt');
bullet('Durée — En secondes (dépend de la config globale par défaut)');
bullet('Changement de pneus — Oui/Non');
bullet('Ravitaillement — Oui/Non');
doc.moveDown(0.5);

subheading('Affichage sur la frise');
body('Les pit stops apparaissent comme des espaces entre les blocs de relais. Des icônes de pneus et de carburant peuvent être affichées (activables depuis la barre d\'outils).');

doc.moveDown(0.5);
subheading('Pit stops automatiques');
body('Lorsque l\'application est connectée à iRacing, les pit stops sont détectés automatiquement (voir section 8). Le système crée un nouvel enregistrement de pit stop avec les données réelles de la course.');

// ══════════════════════════════════════
// 7. CONNEXION IRACING
// ══════════════════════════════════════
doc.addPage();
title('7. Connexion iRacing en Temps Réel');

body('Race Planner peut se connecter directement à iRacing pour recevoir les données de télémétrie en temps réel et synchroniser la frise avec la course en cours.');
doc.moveDown(0.3);

subheading('Prérequis');
bullet('iRacing doit être lancé et une session de course doit être en cours');
bullet('La télémétrie partagée doit être activée dans les options iRacing');
bullet('L\'application utilise irsdk-node pour accéder à la mémoire partagée d\'iRacing');
doc.moveDown(0.5);

subheading('Données reçues');
const telemetryData = [
  ['SessionTime', 'Temps écoulé depuis le début de la session'],
  ['SessionTimeOfDay', 'Heure du jour dans le jeu (pour la frise)'],
  ['Lap', 'Numéro du tour actuel'],
  ['FuelLevel', 'Carburant restant en litres'],
  ['LapLastLapTime', 'Temps du dernier tour complété'],
  ['LapBestLapTime', 'Meilleur temps au tour de la session'],
  ['PlayerCarPosition', 'Position dans le classement'],
  ['TrackTempCrew', 'Température de la piste'],
  ['IsOnTrack', 'Si la voiture est en piste'],
  ['OnPitRoad', 'Si la voiture est dans la voie des stands'],
];

for (const [key, desc] of telemetryData) {
  checkNewPage(30);
  doc.fontSize(9).font('Courier').fillColor(COLORS.primary).text(key, 60, doc.y, { continued: true });
  doc.font('Helvetica').fillColor(COLORS.text).text(` — ${desc}`);
  doc.moveDown(0.1);
}

doc.moveDown(0.5);
subheading('Synchronisation de la frise');
body('Lorsque la connexion est active, la frise se synchronise automatiquement avec l\'heure de la course. Le curseur de temps se déplace en temps réel et la vue se recentre automatiquement pour garder la position actuelle visible (à 30% de l\'écran).');

doc.moveDown(0.3);
subheading('Connexion / Déconnexion');
body('Utilisez le panneau Live pour connecter ou déconnecter iRacing. En cas de perte de connexion, l\'application tente automatiquement de se reconnecter toutes les 5 secondes.');

// ══════════════════════════════════════
// 8. DÉTECTION AUTO PIT STOPS
// ══════════════════════════════════════
doc.addPage();
title('8. Détection Automatique des Pit Stops');

body('C\'est l\'une des fonctionnalités les plus puissantes de Race Planner. Lorsque connecté à iRacing, l\'application détecte automatiquement les passages aux stands et met à jour le planning en conséquence.');
doc.moveDown(0.3);

subheading('Comment ça fonctionne');
body('Le système surveille le signal OnPitRoad d\'iRacing :');
doc.moveDown(0.2);

doc.fontSize(10).font('Helvetica-Bold').fillColor(COLORS.green).text('1. Entrée aux stands détectée', 70);
body('Quand la voiture entre dans la voie des stands :');
bullet('Le relai en cours est automatiquement raccourci');
bullet('L\'heure de fin est mise à jour avec l\'heure réelle d\'entrée au stand');
bullet('Le niveau de carburant au moment de l\'arrêt est enregistré');
doc.moveDown(0.3);

doc.fontSize(10).font('Helvetica-Bold').fillColor(COLORS.blue).text('2. Sortie des stands détectée', 70);
body('Quand la voiture quitte la voie des stands :');
bullet('Un pit stop est créé avec la durée réelle de l\'arrêt');
bullet('La détection du ravitaillement est automatique (comparaison du carburant avant/après)');
bullet('Le changement de pneus est marqué par défaut (ajustable manuellement)');
bullet('Le prochain relai planifié est mis à jour : heure de début = heure de sortie des stands');
bullet('Si aucun relai suivant n\'existe, un nouveau relai de 90 min est créé automatiquement');
doc.moveDown(0.3);

checkNewPage(60);
doc.fontSize(10).font('Helvetica-Bold').fillColor(COLORS.accent).text('3. Marquage automatique', 70);
body('Les relais et pit stops créés automatiquement sont marqués avec la note "[Auto - iRacing]" pour les distinguer des éléments planifiés manuellement.');

doc.moveDown(0.5);
subheading('Exemple concret');
body('Vous avez planifié un relai de 16:00 à 17:30. À 17:15, le pilote rentre aux stands. Race Planner va :');
bullet('Raccourcir le relai actuel : 16:00 → 17:15 (au lieu de 17:30)');
bullet('Attendre la sortie des stands (ex: 17:16)');
bullet('Créer un pit stop de 60 secondes avec refuel détecté');
bullet('Ajuster le relai suivant pour démarrer à 17:16');

// ══════════════════════════════════════
// 9. FRISE CHRONOLOGIQUE
// ══════════════════════════════════════
doc.addPage();
title('9. Frise Chronologique (Timeline)');

body('La frise est le composant visuel central de Race Planner. Elle offre une vue complète de la course sur un axe temporel.');
doc.moveDown(0.3);

subheading('Éléments visuels');
bullet('Axe temporel — Gradations horaires et quart-d\'heure en haut de la frise');
bullet('Blocs de relais — Rectangles colorés par pilote avec nom et durée');
bullet('Zones jour/nuit — Gradient de fond indiquant les périodes sombres (coucher → lever du soleil)');
bullet('Marqueurs soleil — Icônes de coucher et lever de soleil sur l\'axe');
bullet('Drapeau à damier — Ligne verticale en damier noir et blanc à la fin de course');
bullet('Heure de fin — Affichée en doré au-dessus du drapeau à damier');
bullet('Curseur de temps — Ligne rouge indiquant la position actuelle (mode live)');
doc.moveDown(0.5);

subheading('Navigation');
bullet('Zoom — Molette de la souris pour zoomer/dézoomer (échelle 0.1x à 60x)');
bullet('Défilement — Clic-glisser pour naviguer horizontalement');
bullet('Le zoom reste centré sur la position du curseur de la souris');
doc.moveDown(0.5);

subheading('Mode Live');
body('Lorsque la connexion iRacing est active et le suivi lancé :');
bullet('Le curseur de temps rouge se déplace en temps réel');
bullet('La vue se recentre automatiquement pour suivre la progression');
bullet('La position est maintenue à 30% de l\'écran pour voir ce qui vient');

doc.moveDown(0.5);
subheading('Rendu Canvas');
body('La frise utilise un Canvas HTML5 avec un système de calques pour des performances optimales, même sur des courses de 24 heures. Les calques sont rendus dans cet ordre : fond → axe temporel → marqueurs soleil → blocs de relais → transitions → pit stops → curseur.');

// ══════════════════════════════════════
// 10. EXPORT ET SAUVEGARDE
// ══════════════════════════════════════
doc.addPage();
title('10. Export et Sauvegarde');

subheading('Sauvegarde automatique');
body('Race Planner sauvegarde automatiquement votre planning à chaque modification, après un court délai. Les plans sont stockés localement au format JSON via le serveur WebSocket.');
doc.moveDown(0.5);

subheading('Export PDF');
body('Génère un document PDF au format paysage contenant :');
bullet('Le tableau complet des relais avec pilote, horaires, pneus et carburant');
bullet('Le résumé par pilote (temps total et nombre de relais)');
bullet('Les informations de la course (circuit, voiture, durée)');
doc.moveDown(0.5);

subheading('Export CSV');
body('Génère un fichier tableur avec toutes les données des relais, importable dans Excel ou Google Sheets pour analyse avancée.');
doc.moveDown(0.5);

subheading('Undo / Redo');
body('Grâce à la bibliothèque Zundo (middleware Zustand), toutes les modifications du planning peuvent être annulées ou rétablies. L\'historique couvre les modifications de relais, pilotes et configuration.');

// ══════════════════════════════════════
// 11. RACCOURCIS CLAVIER
// ══════════════════════════════════════
doc.addPage();
title('11. Raccourcis Clavier');
doc.moveDown(0.3);

const shortcuts = [
  ['Ctrl + Z', 'Annuler la dernière action'],
  ['Ctrl + Y / Ctrl + Shift + Z', 'Rétablir l\'action annulée'],
  ['Ctrl + S', 'Sauvegarder le planning'],
  ['Molette haut/bas', 'Zoomer / Dézoomer la frise'],
  ['Clic + Glisser', 'Déplacer la vue sur la frise'],
  ['Clic sur un bloc', 'Sélectionner un relai'],
  ['Échap', 'Désélectionner le relai actif'],
];

for (const [key, desc] of shortcuts) {
  checkNewPage(30);
  const y = doc.y;
  doc.rect(60, y - 2, 180, 18).fill(COLORS.bg);
  doc.fontSize(10).font('Courier').fillColor(COLORS.dark).text(key, 70, y + 2);
  doc.font('Helvetica').fillColor(COLORS.text).text(desc, 260, y + 2);
  doc.moveDown(0.6);
}

// ══════════════════════════════════════
// 12. ARCHITECTURE TECHNIQUE
// ══════════════════════════════════════
doc.addPage();
title('12. Architecture Technique');

body('Race Planner est construit avec une architecture moderne orientée performance et maintenabilité.');
doc.moveDown(0.3);

subheading('Stack technique');
const techStack = [
  ['Frontend', 'React 19 + TypeScript strict + Vite 6'],
  ['État global', 'Zustand 5 avec Zundo (undo/redo)'],
  ['Rendu', 'HTML5 Canvas avec système de calques'],
  ['Backend', 'Node.js + WebSocket (ws)'],
  ['Télémétrie', 'irsdk-node v4.4.0 (mémoire partagée iRacing)'],
  ['Validation', 'Zod (schémas synchronisés avec TypeScript)'],
  ['Export PDF', 'PDFKit'],
  ['Monorepo', 'Turborepo (client, server, shared)'],
  ['Desktop', 'Electron 44 + electron-builder'],
];

for (const [key, val] of techStack) {
  checkNewPage(30);
  doc.fontSize(10).font('Helvetica-Bold').fillColor(COLORS.primary).text(key, 70, doc.y, { continued: true });
  doc.font('Helvetica').fillColor(COLORS.text).text(` — ${val}`);
  doc.moveDown(0.15);
}

doc.moveDown(0.5);
subheading('Structure du monorepo');
doc.fontSize(9).font('Courier').fillColor(COLORS.dark);
const tree = [
  'race-planner/',
  '├── packages/',
  '│   ├── client/     # Interface React + Canvas',
  '│   ├── server/     # WebSocket + iRacing bridge + Export',
  '│   └── shared/     # Modèles, schémas Zod, types partagés',
  '├── electron/       # Point d\'entrée Electron (main.cjs)',
  '├── build/          # Icône et ressources',
  '└── package.json    # Config Turborepo + Electron Builder',
];
for (const line of tree) {
  doc.text(line, 70);
}

doc.moveDown(1);
subheading('Communication');
body('Le client et le serveur communiquent via WebSocket sur le port 3001. Les messages sont typés des deux côtés (ClientMessage / ServerMessage) et validés par les schémas Zod partagés. Le serveur Electron embarque un serveur HTTP statique (port 3000) pour servir le client compilé.');

// Footer decoration on last page
doc.moveDown(2);
doc.strokeColor(COLORS.primary).lineWidth(1)
  .moveTo(50, doc.y).lineTo(545, doc.y).stroke();
doc.moveDown(0.5);
doc.fontSize(9).font('Helvetica-Oblique').fillColor(COLORS.muted)
  .text('Race Planner — Documentation générée automatiquement — Septembre 2026', { align: 'center' });

doc.end();
console.log(`PDF généré : ${OUTPUT}`);
