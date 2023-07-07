var axios = require('axios');
var cheerio = require('cheerio');
var TranslationServiceClient = require('@google-cloud/translate').TranslationServiceClient;
var translationClient = new TranslationServiceClient();
// URL веб-страницы, которую вы хотите спарсить
var express = require('express');
var app = express();
app.get('/:word', function (req, res) {
    var url = "https://dictionary.cambridge.org/dictionary/english-russian/".concat(req.params.word);
    axios.get(url);
    // .then(response => {
    //   if (response.status === 200) {
    //     const html = response.data;
    //     const $ = cheerio.load(html);
    //     // Используйте селекторы CSS для извлечения нужных данных
    //     const links = $('.ipa.dipa.lpr-2.lpl-1').first().text();
    //     const examples = $('.degs.had.lbt.lb-cm .lbb.lb-cm.lpt-10 .deg');
    //     const examplesArr = []
    //     examples.each((index, element) => examplesArr.push( $(element).text().trim() ) );
    //     // Выводим результаты
    //     // console.log('Транскрипция:', links);
    //     res.send(examplesArr)
    //   }
    // })
    // .catch(error => {
    //   console.log('Ошибка при выполнении запроса:', error);
    // });
});
app.listen(3000, function () {
    console.log('Сервер запущен на порту 3000');
});
