import { APIGatewayProxyEvent } from 'aws-lambda'
import jwt from 'jsonwebtoken'

export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
}

export function verifyToken(event: APIGatewayProxyEvent): boolean {
  const auth = event.headers.Authorization || event.headers.authorization || ''
  const token = auth.replace('Bearer ', '')
  try {
    jwt.verify(token, process.env.JWT_SECRET || 'journey-memo-secret')
    return true
  } catch {
    return false
  }
}
