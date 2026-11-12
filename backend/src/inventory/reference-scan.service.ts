import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  ServiceUnavailableException,
} from '@nestjs/common';
import sharp from 'sharp';

const MAX_IMAGE_BYTES = 16 * 1024 * 1024;
const MAX_IMAGE_PIXELS = 40_000_000;
const MAX_ATTEMPTS = 3;
const RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504]);
const REFERENCE_FIELDS = [
  'modele',
  'couleur',
  'taille',
  'branche',
  'option',
] as const;
const EXTRACTION_PROMPT = `Tu es un lecteur OCR spécialisé pour les inscriptions gravées sur les branches de lunettes, toutes marques confondues.
Lis la ligne complète exactement comme elle apparaît. Exemple : RB5154 2000 49-21 140. Ne suppose pas que le modèle commence par RB. N'invente ni ne complète les caractères illisibles. Les confusions possibles sont 0/O, 1/I, 5/S, 8/B et tiret/espace.
Retourne un objet JSON avec les clés reference_brute, modele, couleur, taille, branche, option. reference_brute doit contenir l'inscription entière visible. Pour RB3025 001/58 58-14-135 3N, modele=RB3025, couleur=001/58, taille=58-14, branche=135, option=3N. Pour 69961 53□16-140 C4, reference_brute doit être exactement cette ligne, modele=69961, taille=53-16, branche=140, option=C4. Mets une chaîne vide si un champ est illisible. Retourne erreur=introuvable uniquement si aucune partie de l'inscription n'est visible.`;

export interface ReferenceScanUpload {
  buffer: Buffer;
  mimetype: string;
}

export interface ScannedFrameReference {
  reference_brute: string;
  modele: string;
  couleur: string;
  taille: string;
  branche: string;
  option: string;
}

@Injectable()
export class ReferenceScanService {
  async scan(file: ReferenceScanUpload): Promise<{
    reference: ScannedFrameReference;
  }> {
    if (file.buffer.length > MAX_IMAGE_BYTES) {
      throw new BadRequestException(
        'La photo dépasse la taille maximale de 16 Mo.',
      );
    }

    const apiKey = process.env.GROQ_API_KEY?.trim();
    if (!apiKey) {
      throw new InternalServerErrorException(
        'Le service de lecture photo n’est pas configuré. Ajoutez GROQ_API_KEY au serveur.',
      );
    }

    const imageSets = await prepareImages(file.buffer);
    const model = process.env.GROQ_VISION_MODEL?.trim() || 'qwen/qwen3.8-27b';

    const responseText = await this.requestGroq(apiKey, imageSets, model);
    let result: unknown;
    try {
      let jsonText = responseText.trim();
      if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
      }
      result = JSON.parse(jsonText);
    } catch {
      throw new ServiceUnavailableException(
        'Le service de lecture a renvoyé une réponse invalide. Réessayez avec une photo plus nette.',
      );
    }

    const reference = parseReferenceResult(result);
    if (!reference) {
      throw new BadRequestException(
        'Aucune référence lisible. Reprenez une photo nette de l’inscription sur la branche.',
      );
    }
    return { reference };
  }

  private async requestGroq(
    apiKey: string,
    imageSets: string[][],
    model: string,
  ): Promise<string> {
    let imageSetIndex = 0;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
      let response: Response;
      try {
        response = await fetch(
          'https://api.groq.com/openai/v1/chat/completions',
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(
              createGroqPayload(imageSets[imageSetIndex], model),
            ),
            signal: AbortSignal.timeout(60_000),
          },
        );
      } catch {
        if (attempt < MAX_ATTEMPTS) {
          await delay(2 ** (attempt - 1) * 2_000);
          continue;
        }
        throw new ServiceUnavailableException(
          'Impossible de joindre le service de lecture photo. Vérifiez la connexion Internet puis réessayez.',
        );
      }

      if (!response.ok) {
        if (response.status === 413 && imageSetIndex < imageSets.length - 1) {
          imageSetIndex += 1;
          attempt -= 1;
          continue;
        }
        if (response.status === 413) {
          throw new ServiceUnavailableException(
            'La photo est encore trop volumineuse pour le service de lecture. Réessayez en cadrant uniquement l’inscription.',
          );
        }
        if (RETRYABLE_STATUSES.has(response.status) && attempt < MAX_ATTEMPTS) {
          await delay(2 ** (attempt - 1) * 2_000);
          continue;
        }
        throw new ServiceUnavailableException(
          `Le service de lecture photo est indisponible (erreur ${response.status}, modèle ${model}). Réessayez plus tard.`,
        );
      }

      const body: unknown = await response.json().catch(() => undefined);
      const content = getCompletionContent(body);
      if (content) return content;
      throw new ServiceUnavailableException(
        'Le service de lecture photo n’a pas renvoyé de résultat exploitable.',
      );
    }

    throw new ServiceUnavailableException(
      'Le service de lecture photo est temporairement indisponible.',
    );
  }
}

function createGroqPayload(images: string[], model: string) {
  return {
    model,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: EXTRACTION_PROMPT },
          ...images.map((image) => ({
            type: 'image_url',
            image_url: { url: image },
          })),
        ],
      },
    ],
    temperature: 0.1,
    max_completion_tokens: 512,
    response_format: { type: 'json_object' },
  };
}

export function parseReferenceResult(
  result: unknown,
): ScannedFrameReference | null {
  if (!result || typeof result !== 'object' || Array.isArray(result)) {
    return null;
  }
  const data = result as Record<string, unknown>;
  if (data.erreur === 'introuvable') return null;

  const aliases: Record<string, (typeof REFERENCE_FIELDS)[number]> = {
    modèle: 'modele',
    model: 'modele',
    modele: 'modele',
    couleurs: 'couleur',
    couleur: 'couleur',
    size: 'taille',
    taille: 'taille',
    temple: 'branche',
    branch: 'branche',
    branche: 'branche',
    option: 'option',
  };
  const normalizedFields: Partial<
    Record<(typeof REFERENCE_FIELDS)[number], string>
  > = {};
  for (const [key, value] of Object.entries(data)) {
    const canonical = aliases[key.trim().toLowerCase()];
    if (canonical) normalizedFields[canonical] = normalizeValue(value);
  }
  const fields = Object.fromEntries(
    REFERENCE_FIELDS.map((field) => [field, normalizedFields[field] || '']),
  ) as Record<(typeof REFERENCE_FIELDS)[number], string>;
  const raw = normalizeValue(data.reference_brute);
  const parsed = decomposeReference(raw);
  for (const field of REFERENCE_FIELDS) {
    fields[field] ||= parsed[field];
  }

  const reference_brute =
    raw || REFERENCE_FIELDS.map((field) => fields[field]).filter(Boolean).join(' ');
  if (!reference_brute) return null;
  return { reference_brute, ...fields };
}

function getCompletionContent(body: unknown): string | null {
  if (!body || typeof body !== 'object') return null;
  const choices = (body as { choices?: unknown }).choices;
  if (!Array.isArray(choices) || !choices[0] || typeof choices[0] !== 'object') {
    return null;
  }
  const message = (choices[0] as { message?: unknown }).message;
  if (!message || typeof message !== 'object') return null;
  const content = (message as { content?: unknown }).content;
  return typeof content === 'string' && content.trim()
    ? content.trim()
    : null;
}

function normalizeValue(value: unknown): string {
  const text =
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
      ? String(value)
      : '';
  return text
    .trim()
    .replace(/[’`]/g, "'")
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ');
}

function decomposeReference(text: string): Record<string, string> {
  const normalized = text.toUpperCase();
  const result = {
    modele: '',
    couleur: '',
    taille: '',
    branche: '',
    option: '',
  };
  const rayBanModel = normalized.match(/\bRB\s(\d{4})\b/);
  const firstModel = normalized.match(/^\s*([A-Z0-9]{4,})\b/);
  result.modele = rayBanModel
    ? `RB${rayBanModel[1]}`
    : (firstModel?.[1] ?? '');

  const color = normalized.match(/\b(\d{3}\s\/\s\d{2}|\d{4})\b/);
  if (color) result.couleur = color[1].replace(/\s+/g, '');

  const dimensions = normalized.match(
    /\b(\d{2})\s*[-X□O0]\s*(\d{2})\s*[-\s]+\s*(\d{3})\b/,
  );
  if (dimensions) {
    result.taille = `${dimensions[1]}-${dimensions[2]}`;
    result.branche = dimensions[3];
  }

  const option = normalized.match(/\b(?:([0-9][A-Z])|([A-Z][0-9]))\b/);
  if (option) result.option = option[1] || option[2];
  return result;
}

async function prepareImages(buffer: Buffer): Promise<string[][]> {
  try {
    const { data, info } = await sharp(buffer, {
      limitInputPixels: MAX_IMAGE_PIXELS,
    })
      .rotate()
      .toBuffer({ resolveWithObject: true });
    const { width, height } = info;
    if (width < 1 || height < 1) {
      throw new Error('Empty image');
    }

    const left = Math.floor(width * 0.2);
    const top = Math.floor(height * 0.2);
    const cropWidth = Math.max(1, Math.floor(width * 0.6));
    const cropHeight = Math.max(1, Math.floor(height * 0.6));
    const enhanced = await sharp(data)
      .extract({
        left,
        top,
        width: Math.min(cropWidth, width - left),
        height: Math.min(cropHeight, height - top),
      })
      .resize({
        width: 1440,
        height: 1440,
        fit: 'inside',
        kernel: sharp.kernel.cubic,
      })
      .greyscale()
      .clahe({ width: 8, height: 8, maxSlope: 2 })
      .sharpen({ sigma: 2, m1: 1.7, m2: 0.7 })
      .jpeg({ quality: 78 })
      .toBuffer();
    const rotated = await sharp(enhanced)
      .rotate(90)
      .jpeg({ quality: 78 })
      .toBuffer();
    const scene = await sharp(data)
      .resize({
        width: 1100,
        height: 1100,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality: 72 })
      .toBuffer();
    const compactCrop = await sharp(enhanced)
      .resize({ width: 800, height: 800, fit: 'inside' })
      .jpeg({ quality: 58 })
      .toBuffer();

    const toDataUrl = (image: Buffer) =>
      `data:image/jpeg;base64,${image.toString('base64')}`;
    return [
      [scene, enhanced, rotated].map(toDataUrl),
      [compactCrop].map(toDataUrl),
    ];
  } catch {
    throw new BadRequestException(
      'Le fichier reçu n’est pas une photo lisible. Réessayez au format JPEG, PNG, WebP ou AVIF.',
    );
  }
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
