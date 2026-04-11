import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, GetCommand, PutCommand, ScanCommand } from '@aws-sdk/lib-dynamodb'
import { CORS_HEADERS, verifyToken } from './utils'

const TABLE_NAME = process.env.TABLE_NAME || 'journey-memo-travels'

const client = new DynamoDBClient({})
const ddb = DynamoDBDocumentClient.from(client)

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

  if (event.httpMethod === 'GET' && !event.pathParameters?.prefectureCode) {
    const result = await ddb.send(new ScanCommand({ TableName: TABLE_NAME }))
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify(result.Items || []),
    }
  }

  const prefectureCode = event.pathParameters?.prefectureCode

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

  if (event.httpMethod === 'PUT') {
    const body = JSON.parse(event.body || '{}')
    const item = { ...body, prefectureCode, updatedAt: new Date().toISOString() }
    await ddb.send(new PutCommand({ TableName: TABLE_NAME, Item: item }))
    return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify(item) }
  }

  return { statusCode: 405, headers: CORS_HEADERS, body: JSON.stringify({ message: 'Method Not Allowed' }) }
}
