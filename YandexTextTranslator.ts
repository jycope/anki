import TextTranslatorConnector from './TextTranslatorConnector';
const axios = require('axios');

export default class YandexTextTranslator implements TextTranslatorConnector {
  private apiKey = process.env.API_KEY;

  private headers = {
    'Content-Type': 'text/plain',
    'Authorization': `Bearer ${this.apiKey}`
  }

  private folderId = process.env.FOLDER_ID
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
