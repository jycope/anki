export default abstract class LoadedPage {
  protected url: string;

  constructor(url: string) {
    this.url = url;
  }

  abstract getLoadedPage(): Promise<string>;
}
