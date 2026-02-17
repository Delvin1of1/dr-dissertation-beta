// pages/api/generate-docx.js - Generate Word document from review text

import { Packer } from 'docx';
import { generateHAISTDocx } from '../../utils/docx-generator';

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-Requested-With, Accept'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      reviewText,
      studentName = '',
      documentType = 'Full Dissertation',
      fileName = 'dissertation.pdf',
    } = req.body;

    if (!reviewText) {
      return res.status(400).json({ error: 'Review text is required' });
    }

    // Generate DOCX document
    const doc = await generateHAISTDocx({
      reviewText,
      studentName,
      documentType,
      fileName,
    });

    // Convert to buffer
    const buffer = await Packer.toBuffer(doc);

    // Convert to base64 for client-side download
    const base64 = buffer.toString('base64');

    return res.status(200).json({
      success: true,
      docxBase64: base64,
      fileName: `${fileName.replace(/\.[^/.]+$/, '')}_HAIST_Review.docx`,
    });
  } catch (error) {
    console.error('Error generating DOCX:', error);
    return res.status(500).json({
      error: 'Failed to generate Word document',
      message: error.message,
    });
  }
}
