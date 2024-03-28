const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const fs = require('fs');
let randomWords = require('random-words');
require('dotenv/config');

const express = require('express');
const app = express();

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

const bot = new TelegramBot(process.env.API_KEY, {polling: true});

bot.onText(/\/ciao/, (msg) => {
  const chatId = msg.chat.id;
  const namePromise = new Promise((resolve, reject) => {
    fs.readFile('animals.json', (err, data) => {
      if (err) reject(err);
      const nomi = JSON.parse(data);
      const randomIndex = Math.floor(Math.random() * nomi.length);
      resolve(nomi[randomIndex]);
    });
  });
  namePromise.then((nome) => {
    bot.sendMessage(chatId, 'Ciao '+msg.from.first_name+'! You are a '+nome);
  });

});

bot.onText(/\/fight (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const chatType = msg.chat.type;

  if (chatType === 'group' || chatType === 'supergroup') {
    const userId = msg.from.id;
    const mentionedUsername = match[1];
    const options = {
      "duration": 120,
      "close_date": Math.floor(Date.now() / 1000) + 120,
      "is_anonymous": false
    };

    try {
      const poll = await bot.sendPoll(chatId, 'Fight!', [msg.from.first_name, mentionedUsername], options);
      const winner = poll.options.reduce((prev, current) => {
        return prev.voter_count > current.voter_count ? prev : current;
      });
      bot.sendMessage(chatId, 'Il vincitore della lotta è: ' + winner.text);
    } catch (err) {
      console.error('Errore:', err);
    }
  } else {
    bot.sendMessage(chatId, 'Il comando /fight funziona solo nei gruppi!');
  }
});

bot.onText(/\/findmymom/, async (msg) => {
  const chatId = msg.chat.id;
  const query = randomWords()+' image'; // La tua query di ricerca personalizzata

  try {
    const apiKey = process.env.API_GOOGLE; // Inserisci la tua API key qui
    const cx = process.env.CX; // Inserisci il tuo cx qui
    const url = `https://www.googleapis.com/customsearch/v1?cx=${cx}&key=${apiKey}&q=${query}&searchType=image`;
  
    const response = await axios.get(url);
    const items = response.data.items;
    
    if (items && items.length > 0) {
      // Prendi una foto a caso dalla lista di risultati
      const randomIndex = Math.floor(Math.random() * items.length);
      const randomItem = items[randomIndex];
      
      const imageUrl = randomItem.link;
      
      // Invia la foto all'utente
      bot.sendPhoto(chatId, imageUrl, {caption: msg.from.first_name +` questa è la tua mamma`});
    } else {
      bot.sendMessage(chatId, 'Nessun risultato trovato.');
    }
  } catch (error) {
    console.error('Errore durante la ricerca su Google:', error);
    bot.sendMessage(chatId, 'Si è verificato un errore durante la ricerca su Google. Riprova più tardi.');
  }
});

bot.onText(/\/hungerGames (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const chatType = msg.chat.type;
  const arrayUtenti = msg.text.split(' ').slice(1); 
  const nomiUtenti = arrayUtenti.map(utente => utente.substring(1));
  let count = 0;
  const taggedUsers = [];
 
 
  if (chatType === 'group' || chatType === 'supergroup') {
    // Cerca gli utenti menzionati e aggiungi gli oggetti User all'array taggedUsers
    msg.entities.forEach((entity) => {
      if (entity.type === 'mention') {
        taggedUsers.push(nomiUtenti[count]);
        count++;
      }
    });

    console.log(taggedUsers);
    if (taggedUsers.length < 2) {
      bot.sendMessage(chatId, 'Devi taggare almeno due utenti!');
      return;
    }

    bot.sendMessage(chatId, 'Inizia la lotta per la sopravvivenza!');

    const participants = taggedUsers;
    let winner = null;

    // Funzione per inviare i messaggi in ordine e con una pausa
    const sendMessageWithDelay = async (message, delay) => {
      return new Promise(resolve => {
        setTimeout(() => {
          bot.sendMessage(chatId, message);
          resolve();
        }, delay);
      });
    }

    while (participants.length > 1) {
      const loserIndex = Math.floor(Math.random() * participants.length);
      const loserId = participants.splice(loserIndex, 1)[0];
      await sendMessageWithDelay(`L'utente @${loserId} è stato ucciso da @`+participants[Math.floor(Math.random() * participants.length)], 1000); // Invia il messaggio con una pausa di 1 secondo
    }

    winner = participants[0];
    await sendMessageWithDelay(`L'utente @${winner} è il vincitore degli Hunger Games!`, 1000); // Invia il messaggio con una pausa di 1 secondo

  } else {
    bot.sendMessage(chatId, 'Il comando /hungerGames funziona solo nei gruppi!');
  }
});



bot.onText(/\/pisello/, (msg) => {
  rand = Math.floor(Math.random() * 30) + 1;
  bot.sendMessage(msg.chat.id,msg.from.first_name + ' il tuo pisello è lungo ' + rand + ' cm');
});

function shuffle(array) {
  let currentIndex = array.length;
  let temporaryValue, randomIndex;

  while (currentIndex > 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

function readMembersFromFile(file) {
  return new Promise((resolve, reject) => {
    fs.readFile(file, 'utf8', (err, data) => {
      if (err) {
        reject(err);
        return;
      }
      try {
        const members = JSON.parse(data);
        resolve(members);
      } catch (err) {
        reject(err);
      }
    });
  });
}



bot.onText(/\/murder/, async (msg) => {
  const  chatId = msg.chat.id;
  
   
  const sendMessageWithDelay = async (message, delay) => {
    return new Promise(resolve => {
      setTimeout(() => {
        bot.sendMessage(chatId, message);
        resolve();
      }, delay);
    });
  }

  const sendPollWithDelay = async (question, options, correct_answers, optionsDuration, pollDuration) => {
    
      setTimeout(() => {
        
        const pollOptions = {
          is_anonymous: false,
          close_date: optionsDuration,
          is_closed: false,
          quiz : true,
          correct_answers: correct_answers
        };
      
        bot.sendPoll(chatId, question,options.map(members => members) ,pollOptions)
       
          
      }, pollDuration);
  
  }

   try {
    readMembersFromFile('members.json')
    .then(members => {
      readMembersFromFile('weapons.json').then(weapons => {
        readMembersFromFile('defense.json').then(defense => {
     shuffle(defense)
     shuffle(members)
      shuffle(weapons)
     const cadavere = members[0];
     const arma = weapons[0];
     const difesa1 = defense[0];
     const difesa2 = defense[1];
     const difesa3 = defense[2];
  
     sendMessageWithDelay("è morto "+cadavere+" ucciso da "+ arma,1000)

     const assassino = members[1];
   console.log(assassino)
     const sospettato1 = members[2];
     const sospettato2 = members[3];

     const sospettati= [assassino,sospettato1,sospettato2];
     shuffle(sospettati)
   
     sendMessageWithDelay("i tre maggiori sospettati per l'omicidio di " + cadavere+" sono "+sospettati[0] + ", "+ sospettati[1]+", "+sospettati[2],1500)
    
      sendMessageWithDelay(sospettati[0]+" si difende dicendo che "+difesa1,2000)
      sendMessageWithDelay(sospettati[1]+" si difende dicendo che "+difesa2,2400)
      sendMessageWithDelay(sospettati[2]+" si difende dicendo che "+difesa3,2800)
     
    let correct_answers = []
    const pollQuestion = "Chi è il killer?";
    const pollOptions = sospettati;
    sospettati.map((sospettato, index) => {
      if (sospettato === assassino) {
        correct_answers.push(index);
      }
    });
    const pollOptionsDuration = 30;
    const closeDate = Math.floor(Date.now() / 1000) + pollOptionsDuration;
    const pollDuration = 3000;

    sendPollWithDelay(pollQuestion, pollOptions,correct_answers, closeDate, pollDuration)

    
    sendMessageWithDelay("Il killer è " +assassino,35500)
        })
      });
  })
    } catch (error) {
     console.error(error);
     bot.sendMessage(chatId, 'C\'è stato un errore nell\'esecuzione del comando!');
    }

 });

 bot.onText(/\/ora/, async (msg) => {
  try {
    
    const currentTime = new Date().toLocaleTimeString('it-IT', { timeZone: "Europe/Rome" });

    bot.sendMessage(msg.chat.id, `L'ora corrente è: ${currentTime}`);
  } catch (error) {
    console.error(error);
    bot.sendMessage(msg.chat.id, 'C\'è stato un errore nell\'esecuzione del comando!');
  }
});
