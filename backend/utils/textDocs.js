import { Document, Packer, Paragraph } from 'docx';
import { PDFDocument, StandardFonts } from 'pdf-lib';

const A4_WIDTH = 595.28;
const A4_HEIGHT = 841.89;

function wrapLine(text, font, fontSize, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    const candidateWidth = font.widthOfTextAtSize(candidate, fontSize);

    if (candidateWidth <= maxWidth) {
      current = candidate;
    } else {
      if (current) {
        lines.push(current);
      }
      current = word;
    }
  }

  if (current) {
    lines.push(current);
  }

  return lines.length > 0 ? lines : [''];
}

export async function textToDocxBuffer(text) {
  const paragraphs = text
    .split('\n')
    .map((line) => new Paragraph({ text: line.length > 0 ? line : ' ' }));

  const doc = new Document({
    sections: [{
      properties: {},
      children: paragraphs,
    }],
  });

  return Packer.toBuffer(doc);
}

export async function textToPdfBuffer(text) {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const fontSize = 12;
  const lineHeight = 18;
  const margin = 50;
  const maxWidth = A4_WIDTH - margin * 2;

  let page = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);
  let y = A4_HEIGHT - margin;

  const paragraphs = text.split('\n');

  for (const paragraph of paragraphs) {
    const lines = wrapLine(paragraph || ' ', font, fontSize, maxWidth);

    for (const line of lines) {
      if (y - lineHeight < margin) {
        page = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);
        y = A4_HEIGHT - margin;
      }

      page.drawText(line, {
        x: margin,
        y,
        size: fontSize,
        font,
      });

      y -= lineHeight;
    }
  }

  return Buffer.from(await pdfDoc.save());
}
