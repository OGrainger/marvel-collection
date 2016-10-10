#!/usr/bin/env node

/*A corriger :
commander
*/
const program = require('commander')
const inquirer = require('inquirer')
const db = require('sqlite')
const http = require('http')
const qs = require('querystring')
const fs = require('fs')
const request = require('superagent')

//clés pour l'API Marvel
const PUBLICKEY = '53b9f342a667913390e93c981a988e91'
const PRIVATEKEY = 'cb98b834a135073e88b31dcae3ef869edd776c6d'

//Déroulement du programme avec commander
program
  .version('0.0.1')
  .option('-a, --add', 'Recherche et ajoute un comic à ma collection')
  .option('-l, --list', 'Montre ma collection')
  .option('-e, --export','Exporte vos comics')
  .option('-i, --import', 'Importe des comics d\'un fichier comics.txt')

// On parse (convertit en format utilisable) les options
// fonction synchrone
program.parse(process.argv)

//Création / ouverture de la db
db.open('collectionPersonnelle.db').then(() => {
  return db.run("CREATE TABLE IF NOT EXISTS comics (comicId, comicTitle, seriesTitle, description, dateAjoute, annotation)")
}).catch((err) => {
  console.log('ERR > ', err)
})

if (program.add) {
  ajouterComic()
} else if (program.list) {
  VoirComics()
} else if (program.export) {
  exportComics()
} else if (program.import) {
  importComics()
} else {
  menuPrincipal()
}

//--------------FONCTIONS----------------------------------

//Fonctions de navigation----------------------------------

function menuPrincipal() {
  inquirer.prompt([{
    type: 'list',
    message: 'Bonjour, que voulez-vous faire ?',
    name: 'menuPrincipal',
    choices: [
      'Mes comics',
      'Outils',
      'A propos',
      'Quitter'
    ]
  }]).then((rep) => {

    if (rep.menuPrincipal == 'Mes comics') {
      menuMesComics()
    } else if (rep.menuPrincipal == 'Outils') {
      menuOutils()
    } else if (rep.menuPrincipal == 'A propos') {
      menuPropos()
    } else if (rep.menuPrincipal == 'Quitter') {
      console.log('A bientôt !')
      process.exit()
    }
  })
}

function menuMesComics() {
  inquirer.prompt([{
    type: 'list',
    name: 'menuMesComics',
    message: 'Que voulez-vous faire avec votre collection ?',
    choices: [
      'Ajouter un comic',
      'Voir mes comics',
      'Retour',
      'Quitter'
    ]
  }]).then((rep) => {
    if (rep.menuMesComics == 'Ajouter un comic') {
      ajouterComic()
    } else if (rep.menuMesComics == 'Voir mes comics') {
      VoirComics()
    } else if (rep.menuMesComics == 'Retour') {
      menuPrincipal()
    } else if (rep.menuMesComics == 'Quitter') {
      console.log('A bientôt !')
      process.exit()
    }
  })
}

function menuOutils() {
  console.log('Outils utiles pour vos comics. Completez votre collection !')
  inquirer.prompt([{
    type: 'list',
    name: 'menuOutils',
    message: '----------',
    choices: [
      'Importer des comics',
      'Exporter des comics',
      'Retour',
      'Quitter'
    ]
  }]).then((rep) => {
    if (rep.menuOutils == 'Importer des comics') {
      importComics()
    } else if (rep.menuOutils == 'Exporter des comics') {
      exportComics()
    } else if (rep.menuOutils == 'Retour') {
      menuPrincipal()
    } else if (rep.menuOutils == 'Quitter') {
      console.log('A bientôt !')
      process.exit()
    }
  })
}

function menuPropos() {
  console.log('Ce programme permet de stocker une bibliothèque de comics MARVEL en se connectant à l\'API en ligne de MARVEL pour recevoir le nom de la série auquelle appartient le comic, ainsi qu\'un petit descriptif du comic. Vous pouvez annoter vos comics, si par exemple vous l\'avez prêté à un ami. Avec ceci s\'ajoute une fonction recherche de comics manquant à une de vos séries, et une fonction d\'import / export de votre bibliothèque, utile si pas exemple vous changez d\'ordinateur.')
  inquirer.prompt([{
    type: 'list',
    name: 'menuPropos',
    message: '----------',
    choices: [
      'Retour',
      'Quitter'
    ]
  }]).then((rep) => {
    if (rep.menuPropos == 'Retour') {
      menuPrincipal()
    } else if (rep.menuPropos == 'Quitter') {
      console.log('A bientôt !')
      process.exit()
    }
  })
}

//Ajouter un comic dans la db en faisant une cherche dans l'API Marvel à partir du nom
function ajouterComic() {
  inquirer.prompt([{
    type: 'input',
    message: 'Entrez le title de votre comic, nous allons effectuer une recherche.\n La recherche ne prend en compte que le title anglophone. \n',
    name: 'titleStartsWith'
  }]).then((title) => {
    if (title.titleStartsWith == '') {
        console.log('Vous n\'avez pas rentré de charactère, recherche avec la lettre \"A\" :')
        title.titleStartsWith = 'a'
    }
      //Effectue une recherche dans l'API Marvel, retourne maxi. 20 résultats classés du plus récent au plus vieux
  return requestRecherche(title)

  }).then((data) => {
    console.log(data.total + ' résultat(s)')
      //Prépare les résultats à l'affichage en les listant
    return listerResultats(data)
  }).then((listeRecherche) => {
    //Ajoute 2 options aux réponses
    listeRecherche[0].push(new inquirer.Separator(), 'Réeffectuer une recherche', 'Retour', new inquirer.Separator())
      //Affichage des réponses et choix
    return new Promise(function(resolve) {
      inquirer.prompt([{
        type: 'list',
        message: 'Choisissez votre comic ou affinez votre recherche.',
        name: 'choix',
        choices: listeRecherche[0]
      }]).then((rep) => {
        if (rep.choix == 'Réeffectuer une recherche') {
          ajouterComic()
        } else if (rep.choix == 'Retour') {
          menuMesComics()
        } else {
          console.log('Vous avez pris : ' + rep.choix)
          listeRecherche.push(rep.choix)
          resolve(listeRecherche)
        }
      })
    })
  }).then((listeRecherche) => {
    //Retrouve l'ID du comic correspondant au choix
    return new Promise(function(resolve) {
      let index = listeRecherche[0].indexOf(listeRecherche[2])
      let comicId = listeRecherche[1][index]
      resolve(comicId)
    })
  }).then((comicId) => {
    //Avec cet ID, recherche toutes les infos sur ce comic
    return requestComic(comicId)
  }).then((data) => {
    let comic = []
      //Avec ces infos, met en forme et garde uniquement la data utile pour le programme
    return new Promise(function(resolve) {
      comic.push(data.results[0].id, data.results[0].title, data.results[0].series.name, data.results[0].description)
      resolve(comic)
    })
  }).then((comic) => {
    //Ajoute une annotation au comic
    return ajouterAnnotation(comic)
  }).then((comic) => {
    //Ajoute la date
    return new Promise(function(resolve) {
      let d = new Date()
      comic[4] = d.toLocaleDateString()
      resolve(comic)
    })
  }).then((comic) => {
    //Ajoute (enfin!) le comic à la db personnelle
    return db.run("INSERT INTO comics VALUES (" + comic[0] + ", \"" + comic[1] + "\", \"" + comic[2] + "\", \"" + comic[3] + "\", \"" + comic[4] + "\", \"" + comic[5] + "\")")
    console.log("Le comic suivant a été ajouté à votre collection :\n" + comic[1])
  }).then(() => {
    menuMesComics()
  })
}

//Afficher la liste des comics présents dans la db perso, puis lance DetailsComic
function VoirComics() {
  let listeTitleComics = []
  db.all("SELECT * FROM comics ORDER BY comicTitle ASC")
    .then((comics) => {
      return new Promise(function(resolve) {
        for (i = 0; i < comics.length; i++) {
          listeTitleComics.push(comics[i].comicTitle)
        }
        listeTitleComics.push(new inquirer.Separator(), 'Retour', new inquirer.Separator())
        resolve(listeTitleComics)
      })
    }).then((listeTitleComics) => {
      inquirer.prompt([{
        type: 'list',
        message: 'Vos comics :',
        name: 'choix',
        choices: listeTitleComics
      }]).then((title) => {
        if (title.choix == 'Retour') {
          menuMesComics()
        } else {
          DetailsComic(title.choix)
        }
      })
    })
}

//Voir les détails du comic avec son nom, sa série, une description, la date d'ajout et une annotation
function DetailsComic(title) {
  let listeTitleComics = []
  db.all("SELECT * FROM comics").then((comics) => {
    return new Promise(function(resolve) {
      for (i = 0; i < comics.length; i++) {
        listeTitleComics.push(comics[i].comicTitle)
      }
      let index = listeTitleComics.indexOf(title)
      resolve(comics[index])
    })
  }).then((comic) => {
    console.log(comic.comicTitle)
    if (comic.series !== '') {
      console.log('Issu de la série : ' + comic.seriesTitle)
    }
    if (comic.description !== 'null') {
      console.log('\n' + comic.description + '\n')
    } else {
      console.log('\nDescription manquante.\n')
    }
    console.log('Ajouté le ' + comic.dateAjoute)
    if (comic.annotation !== '') {
      console.log('\nNote : \n' + comic.annotation + '\n')
    }
    inquirer.prompt([{
      type: 'list',
      message: 'Actions :',
      name: 'choix',
      choices: [
        'Modifier la note',
        'Supprimer le comic',
        'Voir les comics manquant',
        'Retour'
      ]
    }]).then((title) => {
      if (title.choix == 'Modifier la note') {
        return modifierAnnotation(comic)
      } else if (title.choix == 'Supprimer le comic') {
        return SupprimerComic(comic)
      } else if (title.choix == 'Voir les comics manquant')
        return ComicsManquant(comic)
    }).then(() => {
      VoirComics()
    })
  })
}

//Exporte les comics
function exportComics() {
  db.all("SELECT * FROM comics")
  .then((db) => {
    let ListeQS = []
    for (i = 0; i < db.length; i++) {
      ListeQS[i] = qs.stringify(db[i])
    }
    // Écrire un fichier
    try {
    fs.writeFile('comics.txt', ListeQS, (err) => {
      if (err) throw err
      menuOutils()
    })
    } catch (err) {
      console.error('ERREUR : ', err)
    }
  })
}

//Importe des comics d'un fichier comics.txt (exporté avec la fonction du prog)
function importComics() {
  try {
    fs.readFile('comics.txt', 'utf-8', (err, data) => {
      if (err) throw err
      if (data == '') throw 'Fichier vide'
      data = data.split(",")
      for (i = 0; i < data.length; i++) {
        data[i] = qs.parse(data[i])
        db.run("INSERT INTO comics VALUES ("+data[i].comicId + ", \"" +data[i].comicTitle + "\", \"" + +data[i].seriesTitle+ "\", \"" +data[i].description+ "\", \"" +data[i].dateAjoute+ "\", \"" +data[i].annotation+"\")")
        .catch(() => {
          throw 'fichier corrompu'
          })
        }
        menuOutils()
    })
  } catch(err) {
    console.log('ERREUR : ', err)
    menuOutils()
  }
}

//Fonctions retournant une promesse (fonc anonyme?)--------

function requestRecherche(data) {
  return new Promise(function(resolve, reject) {
    data = qs.stringify(data)
    request
      .get('http://gateway.marvel.com/v1/public/comics?' + data + '&orderBy=-onsaleDate&ts=1&apikey=53b9f342a667913390e93c981a988e91&hash=fdcf2ddc35215ad8cd97d659b769b96a')
      .end(function(err, res) {
        if (err) {
          reject(err)
        } else {
          resolve(res.body.data)
        }
      })
  })
}

function requestComic(id) {
  return new Promise(function(resolve, reject) {
    request
      .get('http://gateway.marvel.com/v1/public/comics/' + id + '?&ts=1&apikey=53b9f342a667913390e93c981a988e91&hash=fdcf2ddc35215ad8cd97d659b769b96a')
      .end(function(err, res) {
        if (err) {
          reject(err)
        } else {
          resolve(res.body.data)
        }
      })
  })
}

function requestSerie(comic) {
  return new Promise(function(resolve, reject) {
      request
        .get('http://gateway.marvel.com/v1/public/series?comics=' + comic.comicId + '&orderBy=-title&ts=1&apikey=53b9f342a667913390e93c981a988e91&hash=fdcf2ddc35215ad8cd97d659b769b96a')
        .end(function(err, res) {
          if (err) {
            reject(err)
          } else {
            resolve(res.body.data.results[0])
          }
        })
      })
}

function listerResultats(data) {
  return new Promise(function(resolve) {
    let listeRecherche = []
    let listeRechercheTitle = []
    let listeRechercheId = []
    for (i = 0; i < data.results.length; i++) {
      listeRechercheTitle.push(data.results[i].title)
      listeRechercheId.push(data.results[i].id)
    }
    listeRecherche.push(listeRechercheTitle, listeRechercheId)
      //  while (i >= data.results.length) {
    resolve(listeRecherche)
      //  }
  })
}

function ajouterAnnotation(comic) {
  return new Promise(function(resolve) {
    inquirer.prompt([{
      //Entre le nom du comic
      type: 'input',
      message: 'Ajoutez une annotation pour ' + comic[1] + '.\n(par exemple, à qui vous l\'avez prêté, si vous l\'avez aimé, etc.). \n',
      name: 'annotation'
    }]).then((res) => {
      return new Promise(function(resolve) {
        comic[5] = res.annotation
        resolve(comic)
      })
    }).then((comic) => {
      resolve(comic)
    })
  })
}

function modifierAnnotation(comic) {
  return new Promise(function(resolve) {
    inquirer.prompt([{
      type: 'input',
      message: 'Ajoutez / modifiez l\'annotation pour ' + comic.comicTitle + '.\n(par exemple, à qui vous l\'avez prêté, si vous l\'avez aimé, etc.). \n',
      name: 'annotation'
    }]).then((res) => {
      return new Promise(function(resolve) {
        comic.annotation = res.annotation
        resolve(comic)
      })
    }).then((comic) => {
        return db.run("UPDATE comics SET annotation = \"" + comic.annotation + "\" WHERE comicId = " + comic.comicId)
    }).then((comic) => {
      resolve(comic)
    })
  })
}

function SupprimerComic(comic) {
    return new Promise(function(resolve) {
      inquirer.prompt([{
        type: 'input',
        message: 'Confirmez la suppression du comic suivant : \n' + comic.comicTitle + '\nEntrez le mot DELETE pour confirmer',
        name: 'deleteOrNot'
      }]).then((res) => {
        return new Promise(function(resolve) {
          if (res.deleteOrNot == 'DELETE') {
            resolve(comic)
          } else {
            VoirComics()
          }
        })
      }).then((comic) => {
          console.log('Le comic '+comic.comicTitle+' a été supprimé.')
          return db.run("DELETE FROM comics WHERE comicId = " + comic.comicId)
      }).then((comic) => {
        resolve(comic)
      })
    })
}

function ComicsManquant(comic) {
  requestSerie(comic)
  .then((res) => {
        return new Promise(function(resolve) {
          let comicsManquant = [comic.seriesTitle, []]
          for (i = 0; i < res.comics.returned; i++) {
            comicsManquant[1].push(res.comics.items[i].name)
          }
          db.all("SELECT comicTitle, seriesTitle FROM comics WHERE seriesTitle = \""+comicsManquant[0]+"\"")
          .then((res) => {
            comicsManquant[2] = res
            resolve(comicsManquant)
          })
      }).then((comicsManquant) => {
        for (i = 0; i < comicsManquant[1].length; i++) {
          for (j = 0; j < comicsManquant[2].length; j++) {
            if (comicsManquant[1][i] == comicsManquant[2][j].comicTitle) {
              comicsManquant[1][i] = ''
            }
          }
        }
        return comicsManquant[1]
      }).then((comicsManquant) => {
        console.log("\nVoici le(s) comic(s) qui vous manque(nt) dans cette série (en comptant les covers alternatifs) : \n")
        for (i = 0; i < comicsManquant.length; i++) {
          if (comicsManquant[i] !== '') {
            console.log(comicsManquant[i])
          }
        }
      })
    })
}
