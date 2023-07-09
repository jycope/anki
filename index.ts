const axios = require('axios');
const cheerio = require('cheerio');

const express = require('express');
const app = express();
const bodyParser = require('body-parser')

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
  private apiKey = 't1.9euelZqYzpLNmM6NmZvOkcnOlJuKle3rnpWalpqanMqXk8uNx5yPz8fKlp3l8_ckSFVa-e8qWjtq_N3z92R2Ulr57ypaO2r8zef1656VmsyalYrJnorLyoyOlpuPic6U7_zF656VmsyalYrJnorLyoyOlpuPic6U.ws_VR3yPKgi6bCHxJXVpyu-orReNy3P86LPdQAojGlCOIxvYQJ-HL39Q2EPBaSRF9AT_SFUP9-_C4RoXdX9jAQ';

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
  
  const updatedData = await Promise.all(
    (await getExamples()).map(async (item: Promise<string>) => {    
      return {
        text: item,
        textTranslate: await new YandexTextTranslator().translate(item),
      };
    })
  );  

  res.render('translation-examples', { examples: await updatedData})

});

app.get('/word', (req: any, res: any) => {
  res.sendFile(__dirname + '/public/upload-form.html');
});

app.listen(3000, () => {
  console.log('Сервер запущен на порту 3000');
});
