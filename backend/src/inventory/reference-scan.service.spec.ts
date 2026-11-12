import sharp from 'sharp';
import {
  parseReferenceResult,
  ReferenceScanService,
} from './reference-scan.service';

describe('ReferenceScanService', () => {
  const originalApiKey = process.env.GROQ_API_KEY;

  afterEach(() => {
    jest.restoreAllMocks();
    if (originalApiKey === undefined) {
      delete process.env.GROQ_API_KEY;
    } else {
      process.env.GROQ_API_KEY = originalApiKey;
    }
  });

  it('keeps the complete recognized reference for the stock field', () => {
    expect(
      parseReferenceResult({
        reference_brute: 'RB5154 2000 49-21 140',
        modele: 'RB5154',
      }),
    ).toEqual({
      reference_brute: 'RB5154 2000 49-21 140',
      modele: 'RB5154',
      couleur: '2000',
      taille: '49-21',
      branche: '140',
      option: '',
    });
  });

  it('rejects a response when no reference could be read', () => {
    expect(parseReferenceResult({ erreur: 'introuvable' })).toBeNull();
    expect(parseReferenceResult({ reference_brute: '' })).toBeNull();
  });

  it('sends the enhanced photo views to the configured vision model', async () => {
    process.env.GROQ_API_KEY = 'test-key';
    const fetch = jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  reference_brute: 'RB5154 2000 49-21 140',
                  modele: 'RB5154',
                }),
              },
            },
          ],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );
    const image = await sharp({
      create: {
        width: 20,
        height: 20,
        channels: 3,
        background: '#ffffff',
      },
    })
      .jpeg()
      .toBuffer();

    await expect(
      new ReferenceScanService().scan({ buffer: image, mimetype: 'image/jpeg' }),
    ).resolves.toEqual({
      reference: expect.objectContaining({
        reference_brute: 'RB5154 2000 49-21 140',
      }),
    });

    const body = fetch.mock.calls[0][1]?.body;
    if (typeof body !== 'string') {
      throw new Error('Expected the Groq request body to be JSON text.');
    }
    const requestBody = JSON.parse(body) as {
      model: string;
      messages: Array<{ content: Array<{ text?: string; image_url?: unknown }> }>;
    };
    expect(requestBody.model).toBe('qwen/qwen3.8-27b');
    expect(requestBody.messages[0].content.filter((part) => part.image_url))
      .toHaveLength(3);
    expect(requestBody.messages[0].content[0].text).toContain(
      'RB5154 2000 49-21 140',
    );
  });

  it('retries a payload rejected as too large with one compact image', async () => {
    process.env.GROQ_API_KEY = 'test-key';
    const fetch = jest
      .spyOn(global, 'fetch')
      .mockResolvedValueOnce(new Response('', { status: 413 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    reference_brute: 'RB5154 2000 49-21 140',
                  }),
                },
              },
            ],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      );
    const image = await sharp({
      create: {
        width: 20,
        height: 20,
        channels: 3,
        background: '#ffffff',
      },
    })
      .jpeg()
      .toBuffer();

    await expect(
      new ReferenceScanService().scan({ buffer: image, mimetype: 'image/jpeg' }),
    ).resolves.toEqual({
      reference: expect.objectContaining({
        reference_brute: 'RB5154 2000 49-21 140',
      }),
    });

    const firstBody = fetch.mock.calls[0][1]?.body;
    const compactBody = fetch.mock.calls[1][1]?.body;
    if (typeof firstBody !== 'string' || typeof compactBody !== 'string') {
      throw new Error('Expected Groq request bodies to be JSON text.');
    }
    const imageCount = (body: string) => {
      const request = JSON.parse(body) as {
        messages: Array<{ content: Array<{ image_url?: unknown }> }>;
      };
      return request.messages[0].content.filter((part) => part.image_url).length;
    };
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(imageCount(firstBody)).toBe(3);
    expect(imageCount(compactBody)).toBe(1);
    expect(compactBody.length).toBeLessThan(firstBody.length);
  });
});
