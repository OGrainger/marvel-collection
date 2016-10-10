#Marvel Collection
##Résumé
Ce programme permet de gérer votre propre collection de comics MARVEL en se synchronisant avec l'API MARVEL en ligne

##Fonctions disponibles
* **Ajouter un comic** - *Recherche un comic dans l'API pour l'ajouter à la bibliothèque personnelle*
* **Voir les comics** - *Affiche les comics de votre bibliothèque personnelle*
* **Comics manquants** - *Recherche les comics manquants à la série du comic sélectionné*
* **Importer comics** - *Importe des comics à partir d'un fichier "comics.txt" présent dans le dossier racine. Compatible uniquement avec un fichier généré avec la fonction Exporter Comics du programme*
* **Exporter comics** - *Exporte vos comics dans un fichier "comics.txt" dans le dossier racine*

##Modules Node JS utilisés
* **Commander** - *Ajoutez -h avec la commande marvel-collection pour voir les options disponibles*
* **Inquirer**
* **sqlite** - *Gestion de la bibliothèque*
* **superagent** - *Requêtes à l'API MARVEL*

##Contributeurs
* **Oscar Grainger** - *oscarvgrainger@gmail.com*

##Bugs connus
-Lors de l'ajout d'un comic, si le champ reste vide -> crash de l'app (contourné par faire une recherche de comics commençant par "A")

-N'arrive pas à trouver la db lors des commandes -l, -e, et -i de commander

-Globalement une mauvaise gestion en cas d'erreur (ex: requête URL qui ne donne rien) (renvoie l'erreur et quitte l'app au lieu de revenir dans un menu)
