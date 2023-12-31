export default interface TextTranslatorConnector {
  translate(text: string): Promise<string>
}
