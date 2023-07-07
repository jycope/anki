const axios = require('axios');
const cheerio = require('cheerio');

// URL веб-страницы, которую вы хотите спарсить

const express = require('express');
const app = express();
const bodyParser = require('body-parser')

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())


interface Translator {
  translate(text: string): any
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
  private apiKey = 't1.9euelZrHysiRm5jHmsmQicudyJ7Ll-3rnpWalpqanMqXk8uNx5yPz8fKlp3l8_c8V15a-e9-W1xN_N3z93wFXFr5735bXE38zef1656Vmo-Vx5ONjJ3JmpiXkJaOipfJ7_zF656Vmo-Vx5ONjJ3JmpiXkJaOipfJ.5V7lis5W_rE5cRDBMZZcDTdCVHBVB38kbrRZvq-xop9RvScaEdRmkU2fMC5aDv1n2BnUlKwmr8ZuIMSi0iLsBw';

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
