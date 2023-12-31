import LoadedPage from './LoadedPage'
const axios = require('axios');
const cheerio = require('cheerio')

export default class HTMLLoadedPage extends LoadedPage {
  protected url: string = ''

  constructor(url: string) {
    super(url)
    this.url = url;
  }

  public async getLoadedPage() {
    try {
      const response = await axios.request({
        method: "GET",
        url: this.url,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36"
        }
      });

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


