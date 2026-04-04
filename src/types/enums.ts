export enum DocumentStatus {
  COMPLETED = 'completed',
  PROCESSING = 'processing',
  EXPIRED = 'expired',
  FAILED = 'failed',
}

export enum DocumentType {
  FROM_HTML = 'from_html',
  UPLOADED = 'uploaded',
  FLATTENED = 'flattened',
  WATERMARKED = 'watermarked',
  ENCRYPTED = 'encrypted',
  COMPRESSED = 'compressed',
  SIGNED = 'signed',
}

export enum EnvelopeStatus {
  CREATED = 'created',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  EXPIRED = 'expired',
}

export enum EnvelopeDocumentStatus {
  PENDING = 'pending',
  SENT_FOR_SIGNING = 'sent_for_signing',
  SIGNING_IN_PROGRESS = 'signing_in_progress',
  SIGNING_FAILED = 'signing_failed',
  COMPLETED = 'completed',
}

export enum DocumentRecipientStatus {
  PENDING = 'pending',
  SIGNED = 'signed',
}

export enum DocumentFieldType {
  SIGNATURE = 'signature',
  TEXT = 'text',
  NUMBER = 'number',
  TEXT_AREA = 'textarea',
  DATE = 'date',
  TIME = 'time',
  DATETIME = 'datetime',
  CHECKBOX = 'checkbox',
  RADIO_BUTTON = 'radio',
  SELECT = 'select',
}

export enum PageSizeType {
  a0 = 'a0',
  a1 = 'a1',
  a2 = 'a2',
  a3 = 'a3',
  a4 = 'a4',
  a5 = 'a5',
  a6 = 'a6',
  ledger = 'ledger',
  tabloid = 'tabloid',
  legal = 'legal',
  letter = 'letter',
}

export enum FileOrientation {
  portrait = 'portrait',
  landscape = 'landscape',
}

export enum EmulateMediaType {
  screen = 'screen',
  print = 'print',
}

export enum PdfStandardFont {
  TimesRoman = 'times-roman',
  TimesBold = 'times-bold',
  TimesItalic = 'times-italic',
  TimesBoldItalic = 'times-bolditalic',
  Helvetica = 'helvetica',
  HelveticaBold = 'helvetica-bold',
  HelveticaOblique = 'helvetica-oblique',
  HelveticaBoldOblique = 'helvetica-boldoblique',
  Courier = 'courier',
  CourierBold = 'courier-bold',
  CourierOblique = 'courier-oblique',
  CourierBoldOblique = 'courier-boldoblique',
}
