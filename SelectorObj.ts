import HTMLLoadedPage from './HtmlLoadedePage'

export default class SelectorObj {
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
      console.log('Ошибка при выполнении запроса:', error);
    }
  }
}


