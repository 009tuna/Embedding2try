declare module "pdf-parse" {
  interface PDFParseResult {
    numpages: number;
    numrender: number;
    info: Record<string, any>;
    metadata: any;
    version: string;
    text: string;
  }
  function pdfParse(dataBuffer: Buffer, options?: Record<string, any>): Promise<PDFParseResult>;
  export = pdfParse;
}
