import HTMLLoadedPage from './HtmlLoadedePage'

export default class WordTranscription {
  private word: string = '';

  constructor(word: string) {
    this.word = `https://dictionary.cambridge.org/dictionary/english-russian/${word}`
  }

  public async getTranscription(): Promise<string> {
    try {
      const loadedPage = new HTMLLoadedPage(this.word).getLoadedPage()

      const $ = await loadedPage;
      const transcription = $('.ipa.dipa.lpr-2.lpl-1:first').text();

      return transcription
    } catch (error) {
      console.log('Ошибка при выполнении запроса:', error);
    }
  }
}


