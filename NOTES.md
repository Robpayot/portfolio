Au niveau des transitions d'univers , plusieurs solutions :

- Dans tous les cas il faut qu'il n'y ait qu'un seul et unique Renderer .
- Première solution , celle de la partie switch Map / ViewerView dans BMW. :
  On crée 1 scène et 1 caméra PAR Univers. Donc 4 instances différentes d'univers. Quand on change d'Univers : 1 à 2. Univers 1 ne détruit pas les objets de sa scène. Il les garde en mémoire
  , en revanche On arrête de renderer cette scene, on initialise la scene de l'univers 2 et on render la scene 2. Comme ça , lorsqu'on reviendra sur la scene 1 , tous les objets seront déjà setUp,
  pas besoin de reset, ça s'affichera instantannément.
  Avantage : Plus facile à gérer, chaque univers a sa propre scene avec ses objets. Chargement très rapide la 2ème fois. (avec les objets là où on les a laissés).
  Inconvénient : Plusieurs caméras à gérer. Comment faire pour les transitions ? (on peut faire un TransitionOut Univers 1 qui switch au même TransitionOut Univers 2. Ou même faire une scène à part juste pour les transitions en attendant le chargement de l'autre)
- Deuxième solution :
  On crée une seule scène et une seule caméra pour tous les univers. Quand on change d'Univers : 1 à 2. On détruit les objets de la scène qui correspondent à l'Univers 1. On déplace l'angle 
  de la caméra. Et on ajoute de nouveaux éléments pour l'Univers 2 dans cette même scène.
  Avantage : On garde une même caméra qui se déplace un peu partout dans le site.
  Inconvénient : Assez bordelique de gérer 4 xp dans une seule et même scène. On doit recréer tous les objets à chaque fois quand on revient sur un univers (donc chargement tj aussi long même si on est déjà passé dans un univers)