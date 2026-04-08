"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || 'journey-memo-secret';
const CORRECT_PASSWORD = 'okazawa';
const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
};
const handler = async (event) => {
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers: CORS_HEADERS, body: '' };
    }
    const body = JSON.parse(event.body || '{}');
    const { password } = body;
    if (password !== CORRECT_PASSWORD) {
        return {
            statusCode: 401,
            headers: CORS_HEADERS,
            body: JSON.stringify({ message: '認証失敗' }),
        };
    }
    const token = jsonwebtoken_1.default.sign({ authorized: true }, JWT_SECRET, { expiresIn: '24h' });
    return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({ token }),
    };
};
exports.handler = handler;
