export interface StoryData {
  story_id: string;
  user_id: string;
  created_at: string;
  question: string;
  media_url?: string;
  metadata?: Record<string, any>;
}

export interface UserAnswer {
  username: string;
  answer: string;
  timestamp?: string;
}

export interface OCRResult {
  text: string;
  confidence: number;
  boundingBoxes?: Array<{
    text: string;
    vertices: Array<{ x: number; y: number }>;
  }>;
}

export interface ParsedAnswers {
  story_id: string;
  answers: UserAnswer[];
  total_answers: number;
  extracted_at: string;
}

export interface AnswerRecord {
  PK: string; // story_id
  SK: string; // username
  story_id: string;
  username: string;
  answer: string;
  extracted_at: string;
  created_at: string;
}

export interface StatisticsRecord {
  PK: string; // story_id
  story_id: string;
  total_answers: number;
  unique_answers: number;
  answer_distribution: Record<string, number>;
  top_answers: Array<{
    answer: string;
    count: number;
    percentage: number;
  }>;
  created_at: string;
  updated_at: string;
}

export interface S3Event {
  Records: Array<{
    s3: {
      bucket: {
        name: string;
      };
      object: {
        key: string;
      };
    };
  }>;
}

export interface LambdaResponse {
  statusCode: number;
  body: string;
  headers?: Record<string, string>;
}

export interface APIGatewayEvent {
  pathParameters?: {
    story_id?: string;
  };
  queryStringParameters?: {
    limit?: string;
    lastKey?: string;
  };
}

export interface Environment {
  ANSWERS_TABLE: string;
  STATISTICS_TABLE: string;
  BUCKET_NAME: string;
  GOOGLE_VISION_KEY?: string;
} 