import TextTranslatorConnector from './TextTranslatorConnector'

export abstract class TextTranslator {
  public abstract getTextTranslator(): TextTranslatorConnector

  public translate(): any {
    this.getTextTranslator();
  }
}
