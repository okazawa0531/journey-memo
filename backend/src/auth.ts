import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import jwt from 'jsonwebtoken'
import { CORS_HEADERS } from './utils'

const JWT_SECRET = process.env.JWT_SECRET || 'journey-memo-secret'
const CORRECT_PASSWORD = 'okazawa'

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS_HEADERS, body: '' }
  }

  const body = JSON.parse(event.body || '{}')
  const { password } = body

  if (password !== CORRECT_PASSWORD) {
    return {
      statusCode: 401,
      headers: CORS_HEADERS,
      body: JSON.stringify({ message: '認証失敗' }),
    }
  }

  const token = jwt.sign({ authorized: true }, JWT_SECRET, { expiresIn: '24h' })
  return {
    statusCode: 200,
    headers: CORS_HEADERS,
    body: JSON.stringify({ token }),
  }
}
