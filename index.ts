const axios = require('axios');
const cheerio = require('cheerio');

const express = require('express');
const app = express();
const bodyParser = require('body-parser')

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
  private apiKey = 't1.9euelZqOkceQyZ6LmJ2QkJ6KiseVzu3rnpWalpqanMqXk8uNx5yPz8fKlp3l8_ddWE5a-e83enIf_d3z9x0HTFr57zd6ch_9zef1656VmpKTjJWYz4qbz5rKlMeNzsyS7_zF656VmpKTjJWYz4qbz5rKlMeNzsyS.ueuIQuQ1dP8Ob-yxND36pkWqvrWII-719EMLTMJtulus2B_RkZDBkzXEb0nIAEuzs7Pj3rJBU1Szu51aE0sYBw';

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
  const url = `https://dictionary.cambridge.org/dictionary/english-russian/${req.body.word}`;
  
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

  async function getTransctiption() {
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
    (await getExamples()).map(async (item: Promise<string>) => {    
      return {
        text: item,
        textTranslate: await new YandexTextTranslator().translate(item),
      };
    })
  );

  res.render('translation-examples', { examples: await updatedData, transctiption: await getTransctiption()})

});

app.get('/word', (req: any, res: any) => {
  res.sendFile(__dirname + '/public/upload-form.html');
});

app.listen(3000, () => {
  console.log('Сервер запущен на порту 3000');
});
