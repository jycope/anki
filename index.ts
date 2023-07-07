const axios = require('axios');
const cheerio = require('cheerio');

// URL веб-страницы, которую вы хотите спарсить

const express = require('express');
const app = express();
const bodyParser = require('body-parser')

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.post('/word', async (req: any, res: any) => {
  const url = `https://dictionary.cambridge.org/dictionary/english-russian/${req.body.word}`;
  const apiKey = 't1.9euelZqXyMubkomJksydj5KJncjGx-3rnpWalpqanMqXk8uNx5yPz8fKlp3l8_cNQmBa-e9wKGx5_t3z901wXVr573AobHn-zef1656VmpaKjZaanJaVlJqeiprNz82U7_zF656VmpaKjZaanJaVlJqeiprNz82U.eVUBlBHq5hMpBEHU4AVzayF0EBJX77xFbnMbxGSLyVCOz3vx3fHpqzMW5PuBZqQ4rzYYJtnpg-Pr0gHZjEK4DA';
  const folderId = 'b1g5moh8p0918sljpfjr'
  
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

  const examples = await getExamples();

  res.send(examples);

  const data = JSON.stringify({
    sourceLanguageCode: 'en',
    targetLanguageCode: 'ru',
    texts: examples
  });


  const urlYandex = `https://translate.api.cloud.yandex.net/translate/v2/translate?folderId=${folderId}`;
  const headers = {
    'Content-Type': 'text/plain',
    'Authorization': `Bearer ${apiKey}`
  };

  axios.post(urlYandex, data, { headers })
    .then(response => {
      res.send(response.data);
    })
    .catch(error => {
      res.send(error);
    });

});

app.get('/word', (req: any, res: any) => {
  res.sendFile(__dirname + '/public/upload-form.html');
});

app.listen(3000, () => {
  console.log('Сервер запущен на порту 3000');
});
