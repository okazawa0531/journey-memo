"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || 'journey-memo-secret';
const TABLE_NAME = process.env.TABLE_NAME || 'journey-memo-travels';
const client = new client_dynamodb_1.DynamoDBClient({});
const ddb = lib_dynamodb_1.DynamoDBDocumentClient.from(client);
const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'GET,PUT,OPTIONS',
};
function verifyToken(event) {
    const auth = event.headers.Authorization || event.headers.authorization || '';
    const token = auth.replace('Bearer ', '');
    try {
        jsonwebtoken_1.default.verify(token, JWT_SECRET);
        return true;
    }
    catch {
        return false;
    }
}
const handler = async (event) => {
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers: CORS_HEADERS, body: '' };
    }
    if (!verifyToken(event)) {
        return {
            statusCode: 401,
            headers: CORS_HEADERS,
            body: JSON.stringify({ message: '認証が必要です' }),
        };
    }
    // GET /travels - 全件取得
    if (event.httpMethod === 'GET' && !event.pathParameters?.prefectureCode) {
        const result = await ddb.send(new lib_dynamodb_1.ScanCommand({ TableName: TABLE_NAME }));
        return {
            statusCode: 200,
            headers: CORS_HEADERS,
            body: JSON.stringify(result.Items || []),
        };
    }
    const prefectureCode = event.pathParameters?.prefectureCode;
    // GET /travels/{prefectureCode}
    if (event.httpMethod === 'GET') {
        const result = await ddb.send(new lib_dynamodb_1.GetCommand({
            TableName: TABLE_NAME,
            Key: { prefectureCode },
        }));
        if (!result.Item) {
            return { statusCode: 404, headers: CORS_HEADERS, body: JSON.stringify({ message: 'Not found' }) };
        }
        return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify(result.Item) };
    }
    // PUT /travels/{prefectureCode}
    if (event.httpMethod === 'PUT') {
        const body = JSON.parse(event.body || '{}');
        const item = { ...body, prefectureCode, updatedAt: new Date().toISOString() };
        await ddb.send(new lib_dynamodb_1.PutCommand({ TableName: TABLE_NAME, Item: item }));
        return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify(item) };
    }
    return { statusCode: 405, headers: CORS_HEADERS, body: JSON.stringify({ message: 'Method Not Allowed' }) };
};
exports.handler = handler;
