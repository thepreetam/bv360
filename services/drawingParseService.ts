import { GoogleGenerativeAI } from '@google/generative-ai';
import type { ParsedDrawingData } from '@/lib/db/types';

function getGeminiModel() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    return genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  } catch {
    return null;
  }
}

const PARSING_PROMPT = `You are a construction document analysis AI. Parse the architectural/structural drawing provided and extract all relevant data in the specified JSON format.

Return ONLY a valid JSON object with this exact structure:
{
  "project_info": {
    "project_name": "string or null",
    "address": "string or null",
    "client_name": "string or null",
    "plan_number": "string or null",
    "revision": "string or null",
    "date": "string or null"
  },
  "structural_elements": [
    {
      "element": "e.g., Header, Beam, Column, Shear Wall",
      "location": "e.g., Grid B3, East Wall, Roof",
      "dimensions": "e.g., 4x12, 3-ply 2x10 LVL",
      "material": "e.g., Douglas Fir, LVL, PSL",
      "notes": "e.g., Engineer letter required, see detail 4A"
    }
  ],
  "dimensions": [
    {
      "type": "e.g., Overall, Room, Opening, Spacing",
      "value": "e.g., 24 ft, 10 ft 6 in, 16 in O.C.",
      "location": "e.g., North elevation, Bedroom 2, Living room",
      "tolerance": "e.g., ±1/4 in, ±1 in"
    }
  ],
  "specifications": [
    {
      "category": "e.g., Framing, Concrete, Finish, MEP",
      "item": "e.g., Stud spacing, Footer depth, Drywall thickness",
      "standard": "e.g., 16 inches O.C., 12 inches O.C.",
      "notes": "e.g., Verify with engineer if different"
    }
  ],
  "rooms": [
    {
      "name": "e.g., Living Room, Kitchen, Master Bedroom",
      "dimensions": "e.g., 14x18 ft",
      "elevation": "e.g., E-101, 104.5 ft",
      "finish": "e.g., R-19 insulation, Sheetrock 1/2 in"
    }
  ],
  "overall_dimensions": {
    "length": "e.g., 48 ft",
    "width": "e.g., 32 ft",
    "height": "e.g., 9 ft 6 in",
    "total_area": "e.g., 1,536 sq ft"
  },
  "raw_text": "Copy all readable text, dimensions, labels, and annotations from the drawing verbatim here."
}

Rules:
- Extract EVERYTHING readable from the drawing
- If a field is not present, use null
- For dimensions, convert mixed units to clear format (e.g., 9\'-6\" as "9 ft 6 in")
- structural_elements should include all headers, beams, columns, trusses, lintels, holdown anchors, shear walls, etc.
- specifications should include code references, material standards, fastener schedules, and general notes
- raw_text should capture ALL text from the drawing for reference
- Return ONLY the JSON object, no markdown, no explanation`;

export async function parseDrawingWithGemini(
  pdfBytes: Buffer,
  fileName: string
): Promise<{ success: true; data: ParsedDrawingData } | { success: false; error: string }> {
  const model = getGeminiModel();

  if (!model) {
    return {
      success: false,
      error: 'GEMINI_API_KEY not configured. Set the environment variable to enable AI parsing.',
    };
  }

  try {
    const base64Data = pdfBytes.toString('base64');
    const mimeType = fileName.toLowerCase().endsWith('.pdf')
      ? 'application/pdf'
      : 'application/octet-stream';

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType,
          data: base64Data,
        },
      },
      { text: PARSING_PROMPT },
    ]);

    const responseText = result.response.text().trim();
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      return { success: false, error: 'Failed to parse drawing: no JSON found in response' };
    }

    const parsed = JSON.parse(jsonMatch[0]) as ParsedDrawingData;

    if (!parsed.project_info || !parsed.overall_dimensions) {
      return { success: false, error: 'Parsing incomplete: missing required fields' };
    }

    return { success: true, data: parsed };
  } catch (err: any) {
    if (err.message?.includes('quota')) {
      return { success: false, error: 'Gemini API quota exceeded. Please try again later.' };
    }
    return { success: false, error: `Parsing failed: ${err.message}` };
  }
}

export function generateMockParsedData(sheetName: string): ParsedDrawingData {
  return {
    project_info: {
      project_name: 'Sample Project',
      address: '123 Main Street',
      plan_number: sheetName.replace('.pdf', '').toUpperCase(),
      revision: 'Rev A',
      date: new Date().toLocaleDateString(),
    },
    structural_elements: [
      {
        element: 'Header',
        location: 'Grid B-C / Line 2',
        dimensions: '3-ply 2x10 LVL',
        material: 'LVL',
        notes: 'Bearing 1.5 in each end',
      },
      {
        element: 'Floor Beam',
        location: 'Grid A / Line 1-3',
        dimensions: '4x12',
        material: 'Douglas Fir #2',
        notes: 'Continuous 3-span',
      },
    ],
    dimensions: [
      {
        type: 'Overall',
        value: '40 ft x 30 ft',
        location: 'Building footprint',
        tolerance: '±2 in',
      },
      {
        type: 'Room',
        value: '12 ft x 14 ft',
        location: 'Master Bedroom',
        tolerance: '±1 in',
      },
    ],
    specifications: [
      {
        category: 'Framing',
        item: 'Exterior studs',
        standard: '2x6 @ 16 in O.C.',
        notes: 'Verify with structural engineer',
      },
      {
        category: 'Framing',
        item: 'Floor joists',
        standard: '2x10 @ 16 in O.C.',
        notes: 'SPF #2 or better',
      },
    ],
    rooms: [
      {
        name: 'Living Room',
        dimensions: '14x18 ft',
        elevation: '104.5 ft',
        finish: 'R-19 wall insulation, 1/2 in drywall',
      },
      {
        name: 'Master Bedroom',
        dimensions: '12x14 ft',
        elevation: '104.5 ft',
        finish: 'R-19 wall insulation, 1/2 in drywall',
      },
    ],
    overall_dimensions: {
      length: '40 ft',
      width: '30 ft',
      height: '9 ft 6 in',
      total_area: '1,200 sq ft',
    },
    raw_text: `[Mock parsed data for ${sheetName}]\nThis would contain all text extracted from the actual PDF when GEMINI_API_KEY is set.`,
  };
}