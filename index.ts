const axios = require('axios');
const cheerio = require('cheerio');

const express = require('express');
const app = express();
const bodyParser = require('body-parser')
const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const urlParse = require('url').parse;
const googleTTS = require('google-tts-api');

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

abstract class TextTranslator {
  public abstract getTextTranslator(): TextTranslatorConnector
  
  public translate(): any
  {
    this.getTextTranslator();
  }
}

interface TextTranslatorConnector {
  translate(text: string): Promise<string>
}

class YandexTranslator extends TextTranslator {
  public getTextTranslator(): TextTranslatorConnector {
    return new YandexTextTranslator();
  }
}

class YandexTextTranslator implements TextTranslatorConnector {
  private apiKey = 't1.9euelZrIi4zLjpHOjYuNj42TlJWcjO3rnpWalpqanMqXk8uNx5yPz8fKlp3l8_cbUEVa-e8rHiMA_d3z91t-Qlr57yseIwD9zef1656VmpzGnMaRm4vGlY-LjYqenJqd7_zF656VmpzGnMaRm4vGlY-LjYqenJqd.lPQGZFmnD-DPCpbXzz-kWTGvm1l4qBNcYDFD16Pq87MqZb4A3qsDxqc6dA6tEL1ooUrBhe3S7wKsH_2i_h3QAA';

  private headers = {
    'Content-Type': 'text/plain',
    'Authorization': `Bearer ${this.apiKey}`
  }

  private folderId = 'b1g5moh8p0918sljpfjr'
  private url = `https://translate.api.cloud.yandex.net/translate/v2/translate?folderId=${this.folderId}`
  
  public async translate( text ): Promise<string>
  {
    let options = JSON.stringify({
      sourceLanguageCode: 'en',
      targetLanguageCode: 'ru',
      texts: text
    });
    
    const headers = this.headers
    const response = await axios.post(this.url, options, { headers })    
    
    return response.data.translations[0].text;
  }
}

app.post('/word', async (req: any, res: any) => {
  const word = req.body.word
  const url = `https://dictionary.cambridge.org/dictionary/english-russian/${word}`;
  const translator = await new YandexTextTranslator();
  async function getExamples() {
    try {
      const response = await axios.get(url);

      if (response.status === 200) {
        const html = response.data;
        const $ = cheerio.load(html);
        const examples = $('.degs.had.lbt.lb-cm .lbb.lb-cm.lpt-10 .deg');
        const examplesArr = []

        examples.each((index, element: any) => examplesArr.push($(element).text().trim()));

        return examplesArr
      }      
    } catch (error) {
      console.log('Ошибка при выполнении запроса:', error);
    }
  }

  async function getTranscription() {
    try {
      const response = await axios.get(url);

      if (response.status === 200) {
        const html = response.data;
        const $ = cheerio.load(html);
        const transcription = $('.ipa.dipa.lpr-2.lpl-1:first').text();

        return transcription
      }      
    } catch (error) {
      console.log('Ошибка при выполнении запроса:', error);
    }
  }
  
  const updatedData = await Promise.all(
    (await getExamples()).map(async (example: Promise<string>) => {
      
      const translatedWord = await translator.translate(word)
      const translatedExample = await translator.translate(example)

      return {
        [word]: {
          text: `${word} (${example})`,
          textTranslate: `${translatedWord} (${translatedExample})`,
        }
      };
    })
  );

  res.render('translation-examples', { 
    examples: await updatedData,
    transcription: await getTranscription(),
    translate: await translator.translate(word),
    word: word
  })

});

app.get('/word', (req: any, res: any) => res.sendFile(__dirname + '/public/upload-form.html'));

app.listen(3000, () => console.log('Сервер запущен на порту 3000'));

app.post('/submit-translation', async (req: any, res: any) => 
  addCardToDeck(
    'English', 
    req.body.example, 
    req.body.exampleTranslated, 
    req.body.word, 
    req.body.transcription
  )
)

async function addCardToDeck(deckName, front, back, word, transcription) {
  const url = 'http://localhost:8765';
  storeMediaFile(word);
  const audioUrl = googleTTS.getAudioUrl('House', {
    lang: 'en',
    slow: false,
    host: 'https://translate.google.com',
  });  
  
  const requestBody = {
    action: 'addNote',
    version: 6,
    params: {
      note: {
        deckName: deckName,
        modelName: 'Basic',
        fields: {
          Front: `${front} ${transcription}`,
          Back: back,
        },
        "audio": [{
          "filename": `${word}.mp3`,
          "path": `/home/dmnikolaevv/.local/share/Anki2/1-й пользователь/collection.media/${word}.mp3`,
          "fields": [
            "Front"
          ]
        }],
        options: {
          allowDuplicate: false,
        },
        tags: [],
      },
    },
  };

  try {
    const response = await axios.post(url, requestBody, {
      headers: {
        'Content-Type': 'application/json',
      }
    });

    console.log('Card added successfully:', response.data);
  } catch (error) {
    console.error('Error adding card:', error);
  }
}

async function storeMediaFile(word) {
  const url = 'http://localhost:8765';
  const audioData = await googleTTS
    .getAudioBase64(word, {
      lang: 'en',
      slow: false,
      host: 'https://translate.google.com',
      timeout: 10000,
    })

  const requestBody = {
    "action": "storeMediaFile",
    "version": 6,
    "params": {
      "filename": `_${word}`,
      "data": audioData
    }
  }

  try {
    const response = await axios.post(url, requestBody, {
      headers: {
        'Content-Type': 'application/json',
      }
    });

    console.log('Image added successfully:', response.data);
  } catch (error) {
    console.error('Error adding image:', error);
  }
}

// Пример использования функции добавления карточки в колоду
;
