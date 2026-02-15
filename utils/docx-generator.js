// utils/docx-generator.js - Professional HAIST© Word Document Generator

import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  convertInchesToTwip,
  Header,
  Footer,
  PageNumber,
  NumberFormat,
  PageBreak,
  BorderStyle,
} from 'docx';

/**
 * Brand colors
 */
const COLORS = {
  brandPurple: '6366F1',
  gold: 'FFD700',
  red: 'DC2626',
  green: '059669',
  yellowHighlight: 'FFF59D',
  darkGray: '374151',
};

/**
 * Parse star rating from review text
 * Looks for patterns like "★★★★★", "⭐⭐⭐⭐⭐", or "5 stars"
 */
function extractStarRating(text) {
  // Count star emojis
  const starMatches = text.match(/[★⭐]/g);
  if (starMatches) {
    return starMatches.length;
  }

  // Look for "X stars" or "X/5"
  const ratingMatch = text.match(/(\d)\s*(?:stars?|\/5)/i);
  if (ratingMatch) {
    return parseInt(ratingMatch[1], 10);
  }

  return 0;
}

/**
 * Generate star rating text run with gold color
 */
function createStarRating(count) {
  const stars = '⭐'.repeat(Math.max(0, Math.min(5, count)));
  return new TextRun({
    text: stars,
    size: 28, // 14pt
    color: COLORS.gold,
  });
}

/**
 * Check if text contains defense blocker indicators
 */
function isDefenseBlocker(text) {
  const lower = text.toLowerCase();
  return (
    lower.includes('defense blocker') ||
    lower.includes('⚠️') ||
    lower.includes('critical') ||
    lower.includes('must fix')
  );
}

/**
 * Create cover page
 */
function createCoverPage(studentName = '', documentType = 'Full Dissertation', reviewDate = new Date()) {
  return [
    new Paragraph({
      text: '',
      spacing: { before: convertInchesToTwip(2) },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: 'HAIST© Dissertation Review',
          size: 36, // 18pt
          bold: true,
          font: 'Times New Roman',
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: convertInchesToTwip(0.5) },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: 'Dr. Dissertation',
          size: 28, // 14pt
          font: 'Times New Roman',
          color: COLORS.brandPurple,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: convertInchesToTwip(1) },
    }),
    ...(studentName
      ? [
          new Paragraph({
            children: [
              new TextRun({
                text: `Prepared for: ${studentName}`,
                size: 24, // 12pt
                font: 'Times New Roman',
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: convertInchesToTwip(0.25) },
          }),
        ]
      : []),
    new Paragraph({
      children: [
        new TextRun({
          text: `Document Type: ${documentType}`,
          size: 24, // 12pt
          font: 'Times New Roman',
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: convertInchesToTwip(0.25) },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Review Date: ${reviewDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}`,
          size: 24, // 12pt
          font: 'Times New Roman',
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: convertInchesToTwip(2) },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: '━━━━━━━━━━━━━━━━━━━━━━━━━━━',
          size: 24,
          font: 'Times New Roman',
          color: COLORS.brandPurple,
        }),
      ],
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      pageBreakBefore: true,
    }),
  ];
}

/**
 * Parse review text into sections
 */
function parseReviewSections(reviewText) {
  const sections = [];
  const lines = reviewText.split('\n');

  let currentSection = { title: '', content: [] };

  for (const line of lines) {
    const trimmed = line.trim();

    // Check if line is a section header (all caps, or starts with ##, or ends with :)
    const isHeader =
      /^#{1,3}\s+/.test(trimmed) ||
      (trimmed.length > 0 && trimmed === trimmed.toUpperCase() && trimmed.length < 60) ||
      (/^[A-Z][^:]{3,50}:$/.test(trimmed) && !trimmed.includes('.'));

    if (isHeader) {
      // Save previous section if it has content
      if (currentSection.content.length > 0) {
        sections.push(currentSection);
      }

      // Start new section
      currentSection = {
        title: trimmed.replace(/^#{1,3}\s+/, '').replace(/:$/, ''),
        content: [],
      };
    } else if (trimmed.length > 0) {
      currentSection.content.push(trimmed);
    }
  }

  // Add last section
  if (currentSection.content.length > 0) {
    sections.push(currentSection);
  }

  return sections;
}

/**
 * Generate Word document from review text
 */
export async function generateHAISTDocx({
  reviewText,
  studentName = '',
  documentType = 'Full Dissertation',
  fileName = 'dissertation.pdf',
}) {
  const reviewDate = new Date();

  // Parse sections
  const sections = parseReviewSections(reviewText);

  // Build document sections
  const documentSections = [
    ...createCoverPage(studentName, documentType, reviewDate),
  ];

  // Add each section
  for (const section of sections) {
    // Section heading
    documentSections.push(
      new Paragraph({
        children: [
          new TextRun({
            text: section.title,
            size: 28, // 14pt
            bold: true,
            font: 'Times New Roman',
            color: COLORS.brandPurple,
          }),
        ],
        heading: HeadingLevel.HEADING_1,
        spacing: {
          before: convertInchesToTwip(0.25),
          after: convertInchesToTwip(0.15),
        },
      })
    );

    // Section content
    for (const contentLine of section.content) {
      const isBlocker = isDefenseBlocker(contentLine);

      // Check for star ratings
      const starCount = extractStarRating(contentLine);

      const children = [];

      // Add warning icon for defense blockers
      if (isBlocker) {
        children.push(
          new TextRun({
            text: '⚠️ ',
            size: 24,
          })
        );
      }

      // Add star rating if found
      if (starCount > 0) {
        children.push(createStarRating(starCount));
        children.push(
          new TextRun({
            text: ' ',
            size: 24,
          })
        );
      }

      // Add main text
      children.push(
        new TextRun({
          text: contentLine,
          size: 24, // 12pt
          font: 'Times New Roman',
          color: isBlocker ? COLORS.red : undefined,
          highlight: isBlocker ? COLORS.yellowHighlight : undefined,
        })
      );

      documentSections.push(
        new Paragraph({
          children,
          spacing: {
            before: 120, // 6pt
            after: 120, // 6pt
            line: 360, // 1.5 line spacing
          },
        })
      );
    }

    // Add spacing between sections
    documentSections.push(
      new Paragraph({
        text: '',
        spacing: { after: convertInchesToTwip(0.2) },
      })
    );
  }

  // Add footer with contact info
  documentSections.push(
    new Paragraph({
      pageBreakBefore: true,
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: 'About Dr. Dissertation',
          size: 28,
          bold: true,
          font: 'Times New Roman',
          color: COLORS.brandPurple,
        }),
      ],
      spacing: { after: convertInchesToTwip(0.15) },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: 'This review was generated using the HAIST© (Human-AI Symbiotic Theory) framework, ',
          size: 24,
          font: 'Times New Roman',
        }),
        new TextRun({
          text: 'developed by Dr. John Chick and the Dr. Dissertation team.',
          size: 24,
          font: 'Times New Roman',
        }),
      ],
      spacing: { after: 240 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: 'Need help implementing these recommendations?',
          size: 24,
          font: 'Times New Roman',
          bold: true,
        }),
      ],
      spacing: { after: 120 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: 'Visit: ',
          size: 24,
          font: 'Times New Roman',
        }),
        new TextRun({
          text: 'https://doctordissertation.com',
          size: 24,
          font: 'Times New Roman',
          color: COLORS.brandPurple,
          underline: {},
        }),
      ],
      spacing: { after: 120 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: 'Email: ',
          size: 24,
          font: 'Times New Roman',
        }),
        new TextRun({
          text: 'drchick@doctordissertation.com',
          size: 24,
          font: 'Times New Roman',
          color: COLORS.brandPurple,
        }),
      ],
    })
  );

  // Create document
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(1),
              right: convertInchesToTwip(1.25),
              bottom: convertInchesToTwip(1),
              left: convertInchesToTwip(1.25),
            },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'HAIST© Review',
                    size: 20,
                    font: 'Times New Roman',
                    color: COLORS.darkGray,
                  }),
                ],
                alignment: AlignmentType.RIGHT,
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'Dr. Dissertation | Page ',
                    size: 20,
                    font: 'Times New Roman',
                    color: COLORS.darkGray,
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    size: 20,
                    font: 'Times New Roman',
                    color: COLORS.darkGray,
                  }),
                ],
                alignment: AlignmentType.CENTER,
              }),
            ],
          }),
        },
        children: documentSections,
      },
    ],
  });

  return doc;
}
