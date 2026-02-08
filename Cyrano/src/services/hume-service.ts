/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

/**
 * Hume Expression Measurement API Service
 * 
 * Integrates with Hume AI's Expression Measurement API for voice emotion analysis.
 * Processes audio recordings to extract emotional prosody, tone, and sentiment.
 * 
 * Reference: https://github.com/HumeAI/hume-api-examples
 * See expression-measurement examples for correct API usage.
 * 
 * API Documentation: https://dev.hume.ai/docs
 */

export interface HumeEmotionResponse {
  emotions: {
    name: string;
    score: number;
  }[];
  prosody: {
    confidence: number;
    pitch: number;
    energy: number;
  };
  metadata: {
    duration: number;
    sampleRate: number;
    format: string;
  };
}

export interface VoiceJournalResult {
  transcription: string;
  emotions: HumeEmotionResponse;
}

class HumeService {
  private apiKey: string;
  // Expression Measurement API endpoints
  // Reference: https://github.com/HumeAI/hume-api-examples/tree/main/expression-measurement
  // Documentation: https://dev.hume.ai/docs
  private readonly baseUrl = 'https://api.hume.ai';
  private readonly batchJobsUrl = `${this.baseUrl}/v0/batch/jobs`;
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000; // ms
  private readonly pollInterval = 2000; // ms - check job status every 2 seconds
  private readonly maxPollAttempts = 60; // Maximum 2 minutes of polling

  constructor() {
    const key = process.env.HUME_API_KEY;
    if (!key) {
      throw new Error('HUME_API_KEY environment variable is required. Get your API key from https://dev.hume.ai');
    }
    this.apiKey = key;
  }

  /**
   * Analyze emotion from audio buffer
   */
  async analyzeEmotion(audioBuffer: Buffer): Promise<HumeEmotionResponse> {
    // Preprocess audio if needed (convert to WAV, 16kHz, mono)
    const processedAudio = await this.preprocessAudio(audioBuffer);

    // Call Hume API with retry logic
    return this.callHumeAPI(processedAudio);
  }

  /**
   * Process voice journal: transcribe + analyze emotion
   */
  async processVoiceJournal(audioBuffer: Buffer): Promise<VoiceJournalResult> {
    // For now, we'll use OpenAI Whisper for transcription (via AIService)
    // and Hume for emotion analysis
    // In a full implementation, this would:
    // 1. Transcribe audio using Whisper
    // 2. Analyze emotion using Hume
    // 3. Return combined result

    const emotions = await this.analyzeEmotion(audioBuffer);
    
    // TODO: Integrate with transcription service (OpenAI Whisper or similar)
    // For now, return placeholder transcription
    const transcription = '[Transcription service not yet integrated]';

    return {
      transcription,
      emotions,
    };
  }

  /**
   * Preprocess audio to Hume API requirements
   * Format: WAV, 16kHz, mono
   */
  private async preprocessAudio(audioBuffer: Buffer): Promise<Buffer> {
    // In a full implementation, this would:
    // 1. Detect current format
    // 2. Convert to WAV if needed
    // 3. Resample to 16kHz if needed
    // 4. Convert to mono if needed
    // 5. Normalize audio levels

    // For now, return buffer as-is (assumes it's already in correct format)
    // TODO: Add audio processing library (e.g., ffmpeg, sox, or node-audio)
    return audioBuffer;
  }

  /**
   * Call Hume Expression Measurement API with retry logic
   * 
   * Reference implementation: https://github.com/HumeAI/hume-api-examples
   * See expression-measurement/batch examples for correct request format
   * 
   * Batch API pattern:
   * 1. Submit job with audio file
   * 2. Poll job status until complete
   * 3. Retrieve results
   */
  private async callHumeAPI(audioBuffer: Buffer, retryCount = 0): Promise<HumeEmotionResponse> {
    try {
      // Install form-data if needed: npm install form-data
      let FormData;
      try {
        FormData = (await import('form-data')).default;
      } catch {
        throw new Error('form-data package required. Install with: npm install form-data');
      }

      const fetch = (await import('node-fetch')).default;

      // Step 1: Submit batch job
      const formData = new FormData();
      // Hume API expects 'file' field for audio
      formData.append('file', audioBuffer, {
        filename: 'recording.wav',
        contentType: 'audio/wav',
      });
      
      // Models configuration - prosody and speech for voice emotion analysis
      formData.append('json', JSON.stringify({
        models: {
          prosody: {},
          speech: {},
        },
      }));

      // Submit job
      const submitResponse = await fetch(this.batchJobsUrl, {
        method: 'POST',
        headers: {
          'X-Hume-Api-Key': this.apiKey,
          ...formData.getHeaders(),
        },
        body: formData as any,
      });

      if (!submitResponse.ok) {
        if (submitResponse.status === 429 && retryCount < this.maxRetries) {
          // Rate limited - retry with exponential backoff
          await this.delay(this.retryDelay * Math.pow(2, retryCount));
          return this.callHumeAPI(audioBuffer, retryCount + 1);
        }

        const errorText = await submitResponse.text();
        throw new Error(`Hume API error: ${submitResponse.status} ${submitResponse.statusText}. ${errorText}`);
      }

      const jobData = await submitResponse.json() as { job_id?: string; id?: string };
      const jobId = jobData.job_id || jobData.id;

      if (!jobId) {
        throw new Error('No job ID returned from Hume API');
      }

      // Step 2: Poll for job completion
      const results = await this.pollJobStatus(jobId);

      // Step 3: Transform results
      return this.transformHumeResponse(results);
    } catch (error) {
      if (retryCount < this.maxRetries && this.isRetryableError(error)) {
        await this.delay(this.retryDelay * Math.pow(2, retryCount));
        return this.callHumeAPI(audioBuffer, retryCount + 1);
      }

      throw new Error(`Failed to analyze emotion: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Poll job status until completion
   */
  private async pollJobStatus(jobId: string): Promise<any> {
    const fetch = (await import('node-fetch')).default;
    const jobStatusUrl = `${this.batchJobsUrl}/${jobId}`;

    for (let attempt = 0; attempt < this.maxPollAttempts; attempt++) {
      const statusResponse = await fetch(jobStatusUrl, {
        method: 'GET',
        headers: {
          'X-Hume-Api-Key': this.apiKey,
        },
      });

      if (!statusResponse.ok) {
        throw new Error(`Failed to check job status: ${statusResponse.status} ${statusResponse.statusText}`);
      }

      const statusData = await statusResponse.json() as { state?: string; status?: string; results?: any; [key: string]: any };
      
      // Check job status
      const status = statusData.state || statusData.status;
      
      if (status === 'COMPLETED' || status === 'completed') {
        // Job completed - get results
        if (statusData.results) {
          return statusData.results;
        }
        // Results might be in a separate endpoint
        const resultsUrl = `${jobStatusUrl}/results`;
        const resultsResponse = await fetch(resultsUrl, {
          headers: {
            'X-Hume-Api-Key': this.apiKey,
          },
        });
        if (resultsResponse.ok) {
          return await resultsResponse.json();
        }
        return statusData;
      }

      if (status === 'FAILED' || status === 'failed' || status === 'ERROR' || status === 'error') {
        throw new Error(`Job failed: ${statusData.error || statusData.message || 'Unknown error'}`);
      }

      // Job still processing - wait and retry
      await this.delay(this.pollInterval);
    }

    throw new Error('Job polling timeout - job did not complete within expected time');
  }

  /**
   * Transform Hume API response to our format
   * 
   * Based on Hume Expression Measurement API structure:
   * - Results contain predictions arrays for each model (prosody, speech, etc.)
   * - Each prediction has emotions array with name and score
   * - Prosody model provides pitch, energy, and other vocal characteristics
   * 
   * Reference: https://dev.hume.ai/docs/expression-measurement-api
   */
  private transformHumeResponse(data: any): HumeEmotionResponse {
    // Hume API returns results with model-specific predictions
    // Structure: { prosody: { predictions: [...] }, speech: { predictions: [...] } }
    
    let emotions: { name: string; score: number }[] = [];
    let prosody = {
      confidence: 0,
      pitch: 0,
      energy: 0,
    };

    // Extract from prosody model predictions (primary source for voice emotion)
    if (data.prosody?.predictions && Array.isArray(data.prosody.predictions)) {
      const prosodyPrediction = data.prosody.predictions[0];
      
      if (prosodyPrediction?.emotions) {
        emotions = prosodyPrediction.emotions.map((e: any) => ({
          name: e.name || e.emotion || 'unknown',
          score: e.score || e.value || 0,
        }));
      }

      // Extract prosody measurements
      if (prosodyPrediction) {
        prosody = {
          confidence: prosodyPrediction.confidence || 0,
          pitch: prosodyPrediction.pitch || prosodyPrediction.f0_mean || 0,
          energy: prosodyPrediction.energy || prosodyPrediction.loudness || 0,
        };
      }
    }

    // Fallback: Extract from speech model if prosody not available
    if (emotions.length === 0 && data.speech?.predictions) {
      const speechPrediction = data.speech.predictions[0];
      if (speechPrediction?.emotions) {
        emotions = speechPrediction.emotions.map((e: any) => ({
          name: e.name || e.emotion || 'unknown',
          score: e.score || e.value || 0,
        }));
      }
    }

    // Fallback: Try direct structure
    if (emotions.length === 0) {
      if (Array.isArray(data.emotions)) {
        emotions = data.emotions;
      } else if (data.predictions?.[0]?.emotions) {
        emotions = data.predictions[0].emotions;
      }
    }

    // Extract metadata
    const metadata = {
      duration: data.duration || data.metadata?.duration || 0,
      sampleRate: data.sample_rate || data.metadata?.sample_rate || 16000,
      format: data.format || data.metadata?.format || 'wav',
    };

    return {
      emotions,
      prosody,
      metadata,
    };
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: any): boolean {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      return message.includes('network') ||
             message.includes('timeout') ||
             message.includes('econnreset') ||
             message.includes('429');
    }
    return false;
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
let humeService: HumeService | null = null;

export function getHumeService(): HumeService {
  if (!humeService) {
    humeService = new HumeService();
  }
  return humeService;
}

// Export for direct use
export const hume = {
  analyzeEmotion: async (audioBuffer: Buffer) => {
    const service = getHumeService();
    return service.analyzeEmotion(audioBuffer);
  },
  processVoiceJournal: async (audioBuffer: Buffer) => {
    const service = getHumeService();
    return service.processVoiceJournal(audioBuffer);
  },
};

}
}