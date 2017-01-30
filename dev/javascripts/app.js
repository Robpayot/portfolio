'use strict';

// Default Babel Polyfill, be careful, be sure you need it
// because it's ~6000 lines of code unminified
// import 'babel-polyfill';
import 'modernizr';
// import * as tools from '@84paris/84.tools';

// Your imports
// import MyComponent from './component.es6'
console.log('%c 84.Boilerplate ===== Your app is ready.', 'background: #000; color: #FFF');

var contexteAudio = new (window.AudioContext || window.webkitAudioContext)(); // définition du contexte audio

var analyseur = contexteAudio.createAnalyser();
var distorsion = contexteAudio.createWaveShaper();
var gainVolume = contexteAudio.createGain();
var filtreAccordable = contexteAudio.createBiquadFilter();

var oscillateur = contexteAudio.createOscillator();
var noeudGain = contexteAudio.createGain();

// connect noeuds
oscillateur.connect(noeudGain);
noeudGain.connect(contexteAudio.destination);

var largeur = window.innerWidth;
var hauteur = window.innerHeight;

var frequenceMax = 6000;
var volumeMax = 1;

var frequenceInitiale = 3000;
var volumeInitial = 0.5;

// paramètres de l'oscillateur

oscillateur.type = 'sine'; // onde sinusoïdale — les autres valeurs possible sont : 'square', 'sawtooth', 'triangle' et 'custom'
oscillateur.frequency.value = frequenceInitiale; // valeur en hertz
oscillateur.start();

noeudGain.gain.value = volumeInitial;

// coordonnées de la souris

var positionX;
var positionY;

// récupère les nouvelles coordonnées de la souris quand elle bouge
// puis assigne les nouvelles valeurs de gain et de pitch

document.onmousemove = updatePage;

function updatePage(e) {   
    positionX = (window.Event) ? e.pageX : e.clientX + (document.documentElement.scrollLeft ? document.documentElement.scrollLeft : document.body.scrollLeft);
    positionY = (window.Event) ? e.pageY : e.clientY + (document.documentElement.scrollTop ? document.documentElement.scrollTop : document.body.scrollTop);
    
    oscillateur.frequency.value = (positionX/largeur) * frequenceMax;
    noeudGain.gain.value = (positionY/hauteur) * volumeMax;

    canvasDraw();
}

function aleatoire(number1, number2) {
  return number1 + (Math.floor(Math.random() * (number2 - number1)) + 1);
}

var canvas = document.querySelector('.canvas');
canvas.width = largeur;
canvas.height = hauteur;

var contexteCanvas = canvas.getContext('2d');

function canvasDraw() {
  var rX = positionX; 
  var rY = positionY;
  var rC = Math.floor((noeudGain.gain.value / volumeMax) * 30);
 
  contexteCanvas.globalAlpha = 0.2;
 
  for(var i=1;i<=15;i=i+2) {
    contexteCanvas.beginPath();
    var chaineStyle = 'rgb(' + 100 + (i * 10) + ',' + Math.floor((noeudGain.gain.value / volumeMax) * 255);
    chaineStyle += ',' + Math.floor((oscillateur.frequency.value / frequenceMax) * 255) + ')';
    contexteCanvas.fillStyle = chaineStyle;
    contexteCanvas.arc(rX + aleatoire(0, 50), rY + aleatoire(0, 50), rC / 2 + i, (Math.PI / 180) * 0, (Math.PI / 180) * 360, false);
    contexteCanvas.fill();
    contexteCanvas.closePath();     
  }    
}

console.log(analyseur);
