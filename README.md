# Marvel Collection

## Résumé

Ce programme permet de gérer votre propre collection de comics MARVEL en se synchronisant avec l'API MARVEL en ligne

## Fonctions disponibles

- **Ajouter un comic** - _Recherche un comic dans l'API pour l'ajouter à la bibliothèque personnelle_
- **Voir les comics** - _Affiche les comics de votre bibliothèque personnelle_
- **Comics manquants** - _Recherche les comics manquants à la série du comic sélectionné_
- **Importer comics** - _Importe des comics à partir d'un fichier "comics.txt" présent dans le dossier racine. Compatible uniquement avec un fichier généré avec la fonction Exporter Comics du programme_
- **Exporter comics** - _Exporte vos comics dans un fichier "comics.txt" dans le dossier racine_

## Modules Node JS utilisés

- **Commander** - _Ajoutez -h avec la commande marvel-collection pour voir les options disponibles_
- **Inquirer**
- **sqlite** - _Gestion de la bibliothèque_
- **superagent** - _Requêtes à l'API MARVEL_

## Contributeurs

- **Oscar Grainger** - _oscarvgrainger@gmail.com_

## Bugs connus

-Lors de l'ajout d'un comic, si le champ reste vide, l'app crash (contourné par la réalisation d'une recherche de comics commençant par "A")

## Dernière mise à jour

Correction de nombreux bugs
