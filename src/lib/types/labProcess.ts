export type OcrDateBlock = {
  date: string | null;
  text: string;
};

export type LabTextBlockPayload = {
  __blockKind: "lab_text";
  text: string;
};

export type LabImageOcrBlockPayload = {
  __blockKind: "lab_image_ocr";
  dateBlocks: OcrDateBlock[];
  rawOcrMarkdown: string;
};

export type LabBlockPayload = LabTextBlockPayload | LabImageOcrBlockPayload;
