const axios = require('axios');
const cheerio = require('cheerio');
require('dotenv').config()

const express = require('express');
const app = express();
const bodyParser = require('body-parser')
const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const urlParse = require('url').parse;
const googleTTS = require('google-tts-api');
const puppeteer = require('puppeteer')

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

abstract class TextTranslator {
  public abstract getTextTranslator(): TextTranslatorConnector

  public translate(): any {
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
  private apiKey = process.env.API_KEY;

  private headers = {
    'Content-Type': 'text/plain',
    'Authorization': `Bearer ${this.apiKey}`
  }

  private folderId = 'b1ga8lcorqhdc0o0khvl'
  private url = `https://translate.api.cloud.yandex.net/translate/v2/translate?folderId=${this.folderId}`

  public async translate(text): Promise<string> {
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


abstract class LoadedPage {
  protected url: string;

  constructor(url: string) {
    this.url = url;
  }

  abstract getLoadedPage(): Promise<string>;
}

class HTMLLoadedPage extends LoadedPage {
  protected url: string = ''

  constructor(url: string) {
    super(url)
    this.url = url;
  }

  public async getLoadedPage() {
    try {
      const response = await axios.get(this.url);

      if (response.status === 200) {
        const html = response.data;
        const $ = cheerio.load(html);
        return $
      }
    } catch (error) {
      console.log('Ошибка при выполнении запроса:', error);
    }
  }
}

class PuppeterLoadedPage extends LoadedPage {
  protected url: string = ''

  constructor(url: string) {
    super(url)
    this.url = url;
  }

  public async getLoadedPage() {
    try {
      const browser = await puppeteer.launch();
      const page = await browser.newPage();

      await page.setDefaultNavigationTimeout(120000);
      await page.goto(this.url);

      return page
    } catch (error) {
      console.log('Ошибка при выполнении запроса:', error);
    }
  }

  public async getSelectorObj(selector: string) {
    try {
      const loadedPage = new PuppeterLoadedPage(this.url).getLoadedPage()

      const page = await loadedPage;

      await page.waitForSelector(selector);
      await page.$(selector)

      return page
    } catch (error) {
      console.log('Ошибка при получении загруженной страницы:', error);
    }
  }
}

class WordTranscription {
  private word: string = '';

  constructor(word: string) {
    this.word = `https://dictionary.cambridge.org/dictionary/english-russian/${word}`
  }

  public async getTranscription(): Promise<string> {
    try {
      const loadedPage = await new SelectorObjPuppeter(this.word).getSelectorObj('.ipa.dipa.lpr-2.lpl-1')
      const transcription = await loadedPage.$eval('.ipa.dipa.lpr-2.lpl-1', (el) => el.innerText)

      return transcription
    } catch (error) {
      console.log('Ошибка при получении транскрипции:', error);
    }
  }
}

class SelectorObjCheerio {
  private word: string = '';

  constructor(word: string) {
    this.word = `https://dictionary.cambridge.org/dictionary/english-russian/${word}`
  }

  public async getSelectorObj(selector: string): Promise<cheerio.Cheerio> {
    try {
      const loadedPage = new HTMLLoadedPage(this.word).getLoadedPage()

      const $ = await loadedPage;
      const selectorObj = $(selector);

      return selectorObj
    } catch (error) {
      console.log('Ошибка при получении загруженной страницы:', error);
    }
  }
}

class SelectorObjPuppeter {
  private word: string = '';

  constructor(word: string) {
    this.word = `https://dictionary.cambridge.org/dictionary/english-russian/${word}`
  }

  public async getSelectorObj(selector: string) {
    try {
      const loadedPage = new PuppeterLoadedPage(this.word).getLoadedPage()

      const page = await loadedPage;

      await page.waitForSelector(selector);
      await page.$(selector)

      return page
    } catch (error) {
      console.log('Ошибка при получении загруженной страницы:', error);
    }
  }
}

app.post('/word', async (req: any, res: any) => {
  const word = req.body.word
  const url = `https://dictionary.cambridge.org/dictionary/english-russian/${word}`;
  const translator = await new YandexTextTranslator();
  const selectorObjPuppeter = await new SelectorObjPuppeter(word);

  async function getExamples() {
    const examples = await selectorObjPuppeter.getSelectorObj('.degs.had.lbt.lb-cm .lbb.lb-cm.lpt-10 .deg');

    return await examples.evaluate(() => {
      return Array.from(document.querySelectorAll('.degs.had.lbt.lb-cm .lbb.lb-cm.lpt-10 .deg'))
        .map(el => el.textContent)
    })
  }


  async function getTranscription() {
    try {
      const loadedPage = await selectorObjPuppeter.getSelectorObj('.ipa.dipa.lpr-2.lpl-1')
      const transcription = await loadedPage.$eval('.ipa.dipa.lpr-2.lpl-1', (el) => el.innerText)

      return transcription
    } catch (error) {
      console.log('Ошибка при получении транскрипции:', error);
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

app.post('/submit-translation', async (req: any, res: any) => {
  await addCardToDeck(
    'English',
    req.body.example,
    req.body.exampleTranslated,
    req.body.word,
    req.body.transcription
  )

  return res.status(200).send('Card added successfully');
});

async function addCardToDeck(deckName, front, back, word, transcription) {
  const url = process.env.ANKI_URL;
  await storeMediaFile(word);

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
          "path": `${process.env.PATH_TO_MEDIA}/${word}.mp3`,
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
    await axios.post(url, requestBody, {
      headers: {
        'Content-Type': 'application/json',
      }
    });
  } catch (error) {
    console.error('Error adding card:', error);
  }
}

async function storeMediaFile(word) {
  const url = process.env.ANKI_URL;
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
      "filename": `${word}.mp3`,
      "data": audioData
    }
  }

  try {
    await axios.post(url, requestBody, {
      headers: {
        'Content-Type': 'application/json',
      }
    });
  } catch (error) {
    console.error('Error adding image:', error);
  }
}
