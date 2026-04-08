import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, GetCommand, PutCommand, ScanCommand } from '@aws-sdk/lib-dynamodb'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'journey-memo-secret'
const TABLE_NAME = process.env.TABLE_NAME || 'journey-memo-travels'

const client = new DynamoDBClient({})
const ddb = DynamoDBDocumentClient.from(client)

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,PUT,OPTIONS',
}

function verifyToken(event: APIGatewayProxyEvent): boolean {
  const auth = event.headers.Authorization || event.headers.authorization || ''
  const token = auth.replace('Bearer ', '')
  try {
    jwt.verify(token, JWT_SECRET)
    return true
  } catch {
    return false
  }
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS_HEADERS, body: '' }
  }

  if (!verifyToken(event)) {
    return {
      statusCode: 401,
      headers: CORS_HEADERS,
      body: JSON.stringify({ message: '認証が必要です' }),
    }
  }

  // GET /travels - 全件取得
  if (event.httpMethod === 'GET' && !event.pathParameters?.prefectureCode) {
    const result = await ddb.send(new ScanCommand({ TableName: TABLE_NAME }))
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify(result.Items || []),
    }
  }

  const prefectureCode = event.pathParameters?.prefectureCode

  // GET /travels/{prefectureCode}
  if (event.httpMethod === 'GET') {
    const result = await ddb.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: { prefectureCode },
    }))
    if (!result.Item) {
      return { statusCode: 404, headers: CORS_HEADERS, body: JSON.stringify({ message: 'Not found' }) }
    }
    return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify(result.Item) }
  }

  // PUT /travels/{prefectureCode}
  if (event.httpMethod === 'PUT') {
    const body = JSON.parse(event.body || '{}')
    const item = { ...body, prefectureCode, updatedAt: new Date().toISOString() }
    await ddb.send(new PutCommand({ TableName: TABLE_NAME, Item: item }))
    return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify(item) }
  }

  return { statusCode: 405, headers: CORS_HEADERS, body: JSON.stringify({ message: 'Method Not Allowed' }) }
}
