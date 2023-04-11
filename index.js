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
      "duration": 10,
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
  const query = randomWords()+' immage'; // La tua query di ricerca personalizzata
  
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
      bot.sendPhoto(chatId, imageUrl, {caption: `Questa è la tua mamma`});
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
  bot.sendMessage(msg.chat.id, 'Il tuo pisello è lungo ' + rand + ' cm');
});

bot.onText(/\/ora/, (msg) => {
  bot.sendMessage(msg.chat.id, 'Sono le ' + new Date().toLocaleTimeString());
});

