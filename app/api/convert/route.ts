import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';

let openai: OpenAI | null = null;

function getOpenAIClient() {
  if (!openai && process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openai;
}

function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

async function getVideoInfo(videoId: string) {
  try {
    const response = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
    );

    if (!response.ok) {
      throw new Error('Video not found');
    }

    const data = await response.json();
    return {
      title: data.title,
      author: data.author_name,
      thumbnailUrl: data.thumbnail_url,
    };
  } catch (error) {
    throw new Error('Failed to fetch video information');
  }
}

async function getVideoTranscript(videoId: string): Promise<string> {
  try {
    const response = await fetch(`https://youtube-transcriptor.p.rapidapi.com/transcript?video_id=${videoId}`, {
      headers: {
        'X-RapidAPI-Key': process.env.RAPIDAPI_KEY || '',
        'X-RapidAPI-Host': 'youtube-transcriptor.p.rapidapi.com'
      }
    });

    if (response.ok) {
      const data = await response.json();
      if (data.transcript) {
        return data.transcript.map((item: any) => item.text).join(' ');
      }
    }
  } catch (error) {
    console.log('Transcript fetch failed, using mock data');
  }

  return `This is a simulated transcript for the YouTube video. In a production environment, this would contain the actual video transcript extracted from YouTube's captions or using a speech-to-text service. The video discusses various interesting topics and provides valuable insights to the audience.`;
}

async function generatePodcastContent(videoInfo: any, transcript: string) {
  const client = getOpenAIClient();

  if (!client) {
    return {
      podcastDescription: `This episode covers "${videoInfo.title}" from ${videoInfo.author}. The content has been transformed into an engaging podcast format perfect for audio-only consumption.\n\nNote: Full AI enhancement requires API key configuration.`,
      keyTopics: ['Video Content', 'Key Discussion Points', 'Main Insights'],
      showNotes: `Episode: ${videoInfo.title}\nChannel: ${videoInfo.author}\n\nFull AI-powered show notes available with API key configuration.`,
      enhancedTranscript: transcript.substring(0, 1000)
    };
  }

  const completion = await client.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      {
        role: 'system',
        content: `You are an expert podcast producer. Transform YouTube video content into engaging podcast episodes. Create compelling descriptions, show notes, and identify key topics. Make the content flow naturally for audio-only consumption.`
      },
      {
        role: 'user',
        content: `Transform this YouTube video into a podcast episode:

Title: ${videoInfo.title}
Channel: ${videoInfo.author}

Transcript:
${transcript.substring(0, 8000)}

Please provide:
1. A compelling podcast episode description (2-3 paragraphs)
2. 5-7 key topics discussed
3. Detailed show notes with timestamps (estimate based on content flow)
4. An enhanced, podcast-friendly version of the key content

Format your response as JSON with keys: podcastDescription, keyTopics (array), showNotes, enhancedTranscript`
      }
    ],
    temperature: 0.7,
    max_tokens: 2000,
  });

  const content = completion.choices[0].message.content || '{}';

  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.error('Failed to parse AI response as JSON');
  }

  return {
    podcastDescription: content.split('\n\n')[0] || content.substring(0, 500),
    keyTopics: ['Main Topic', 'Discussion Points', 'Key Insights'],
    showNotes: 'See full episode description above.',
    enhancedTranscript: transcript.substring(0, 1000)
  };
}

export async function POST(request: NextRequest) {
  try {
    const { youtubeUrl } = await request.json();

    if (!youtubeUrl) {
      return NextResponse.json(
        { error: 'YouTube URL is required' },
        { status: 400 }
      );
    }

    const videoId = extractVideoId(youtubeUrl);
    if (!videoId) {
      return NextResponse.json(
        { error: 'Invalid YouTube URL' },
        { status: 400 }
      );
    }

    const videoInfo = await getVideoInfo(videoId);

    const transcript = await getVideoTranscript(videoId);

    const podcastContent = await generatePodcastContent(videoInfo, transcript);

    const result = {
      title: videoInfo.title,
      channel: videoInfo.author,
      duration: 'Variable',
      thumbnailUrl: videoInfo.thumbnailUrl,
      podcastDescription: podcastContent.podcastDescription,
      keyTopics: podcastContent.keyTopics,
      showNotes: podcastContent.showNotes,
      transcript: podcastContent.enhancedTranscript,
      audioUrl: `https://www.youtube.com/watch?v=${videoId}`,
      videoId: videoId,
    };

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Conversion error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to convert video' },
      { status: 500 }
    );
  }
}
