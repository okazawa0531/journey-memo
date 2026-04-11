import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { CORS_HEADERS, verifyToken } from './utils'

const PHOTO_BUCKET = process.env.PHOTO_BUCKET || ''

const s3 = new S3Client({})

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS_HEADERS, body: '' }
  }

  if (!verifyToken(event)) {
    return { statusCode: 401, headers: CORS_HEADERS, body: JSON.stringify({ message: '認証が必要です' }) }
  }

  if (event.httpMethod === 'POST') {
    const body = JSON.parse(event.body || '{}')
    const { prefectureCode, contentType } = body
    const key = `photos/${prefectureCode}/${crypto.randomUUID()}`

    const command = new PutObjectCommand({
      Bucket: PHOTO_BUCKET,
      Key: key,
      ContentType: contentType || 'image/jpeg',
    })

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 })

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({ uploadUrl, key }),
    }
  }

  if (event.httpMethod === 'DELETE') {
    const body = JSON.parse(event.body || '{}')
    const { key } = body

    await s3.send(new DeleteObjectCommand({ Bucket: PHOTO_BUCKET, Key: key }))

    return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify({ deleted: key }) }
  }

  return { statusCode: 405, headers: CORS_HEADERS, body: JSON.stringify({ message: 'Method Not Allowed' }) }
}
