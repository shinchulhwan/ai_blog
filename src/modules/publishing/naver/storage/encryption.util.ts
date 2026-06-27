import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const KEY_LENGTH = 32;

function deriveKey(secret: string): Buffer {
  return createHash("sha256").update(secret).digest();
}

export function getNaverAuthSecret(): string {
  const secret =
    process.env.NAVER_SESSION_SECRET?.trim() ||
    process.env.NAVER_AUTH_SECRET?.trim();

  if (!secret) {
    throw new Error(
      "NAVER_SESSION_SECRET 환경 변수가 설정되지 않았습니다. 세션·쿠키 암호화에 필요합니다.",
    );
  }

  return secret;
}

export function encryptJson(payload: unknown, secret = getNaverAuthSecret()): string {
  const key = deriveKey(secret);
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key.subarray(0, KEY_LENGTH), iv);
  const plaintext = JSON.stringify(payload);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return [
    iv.toString("base64url"),
    tag.toString("base64url"),
    encrypted.toString("base64url"),
  ].join(".");
}

export function decryptJson<T>(
  encoded: string,
  secret = getNaverAuthSecret(),
): T {
  const key = deriveKey(secret);
  const [ivPart, tagPart, dataPart] = encoded.split(".");

  if (!ivPart || !tagPart || !dataPart) {
    throw new Error("암호화 데이터 형식이 올바르지 않습니다.");
  }

  const iv = Buffer.from(ivPart, "base64url");
  const tag = Buffer.from(tagPart, "base64url");
  const encrypted = Buffer.from(dataPart, "base64url");
  const decipher = createDecipheriv(ALGORITHM, key.subarray(0, KEY_LENGTH), iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return JSON.parse(decrypted.toString("utf8")) as T;
}
