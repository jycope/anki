const axios = require('axios');
const cheerio = require('cheerio');

// URL веб-страницы, которую вы хотите спарсить

const express = require('express');
const app = express();
const bodyParser = require('body-parser')

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())


interface Translator {
  translate(text: Array<any>): any
}
abstract class Creator {
  public abstract factoryMethod(): Translator
  
  public translate(): any
  {
    this.factoryMethod();
  }
}

class YandexCreator extends Creator {
  public factoryMethod(): Translator {
    return new YandexTranslator();
  }
}

class YandexTranslator implements Translator {
  private apiKey = 't1.9euelZqXyMubkomJksydj5KJncjGx-3rnpWalpqanMqXk8uNx5yPz8fKlp3l8_cNQmBa-e9wKGx5_t3z901wXVr573AobHn-zef1656VmpaKjZaanJaVlJqeiprNz82U7_zF656VmpaKjZaanJaVlJqeiprNz82U.eVUBlBHq5hMpBEHU4AVzayF0EBJX77xFbnMbxGSLyVCOz3vx3fHpqzMW5PuBZqQ4rzYYJtnpg-Pr0gHZjEK4DA';

  private headers = {
    'Content-Type': 'text/plain',
    'Authorization': `Bearer ${this.apiKey}`
  }

  private folderId = 'b1g5moh8p0918sljpfjr'
  private url = `https://translate.api.cloud.yandex.net/translate/v2/translate?folderId=${this.folderId}`
  
  public async translate( text ): Promise<any>
  {
    const circularReplacer = () => {
      const seen = new WeakSet();
      return (key, value) => {
        if (typeof value === 'object' && value !== null) {
          if (seen.has(value)) {
            return '[Circular]';
          }
          seen.add(value);
        }
        return value;
      };
    };


    let options = {
      sourceLanguageCode: 'en',
      targetLanguageCode: 'ru',
      texts: text
    };

    console.log(3);
    
    
    const headers = this.headers
    
    return await axios.post(this.url, options, { headers })
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

  res.send(await new YandexTranslator().translate(await getExamples()))

});

app.get('/word', (req: any, res: any) => {
  res.sendFile(__dirname + '/public/upload-form.html');
});

app.listen(3000, () => {
  console.log('Сервер запущен на порту 3000');
});
