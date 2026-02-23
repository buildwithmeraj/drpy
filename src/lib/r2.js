import { S3Client } from "@aws-sdk/client-s3";

const R2_ACCOUNT_CAP_BYTES = 10 * 1024 * 1024 * 1024;

let accountsCache;
const clientsByAccountKey = new Map();

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function normalizeAccount(raw, index) {
  const accountKey = typeof raw?.key === "string" && raw.key.trim()
    ? raw.key.trim()
    : `account${index + 1}`;

  const accountId = raw?.accountId || raw?.account_id || raw?.R2_ACCOUNT_ID;
  const accessKeyId = raw?.accessKeyId || raw?.access_key_id || raw?.R2_ACCESS_KEY_ID;
  const secretAccessKey = raw?.secretAccessKey || raw?.secret_access_key || raw?.R2_SECRET_ACCESS_KEY;
  const bucketName = raw?.bucketName || raw?.bucket || raw?.R2_BUCKET_NAME;
  const publicBaseUrl = raw?.publicBaseUrl || raw?.public_base_url || null;

  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
    throw new Error(`Invalid R2 account config at index ${index}`);
  }

  return {
    key: accountKey,
    accountId,
    accessKeyId,
    secretAccessKey,
    bucketName,
    publicBaseUrl,
  };
}

function getPrimaryAccountFromEnv() {
  return {
    key: "primary",
    accountId: requiredEnv("R2_ACCOUNT_ID"),
    accessKeyId: requiredEnv("R2_ACCESS_KEY_ID"),
    secretAccessKey: requiredEnv("R2_SECRET_ACCESS_KEY"),
    bucketName: requiredEnv("R2_BUCKET_NAME"),
    publicBaseUrl: process.env.R2_PUBLIC_BASE_URL || null,
  };
}

export function getR2Accounts() {
  if (accountsCache) return accountsCache;

  const json = process.env.R2_ACCOUNTS_JSON?.trim();
  if (!json) {
    accountsCache = [getPrimaryAccountFromEnv()];
    return accountsCache;
  }

  let parsed;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error("R2_ACCOUNTS_JSON must be valid JSON.");
  }

  if (!Array.isArray(parsed) || !parsed.length) {
    throw new Error("R2_ACCOUNTS_JSON must be a non-empty array.");
  }

  const normalized = parsed.map((entry, index) => normalizeAccount(entry, index));
  const keys = new Set();
  for (const account of normalized) {
    if (keys.has(account.key)) {
      throw new Error(`Duplicate R2 account key: ${account.key}`);
    }
    keys.add(account.key);
  }

  accountsCache = normalized;
  return accountsCache;
}

function getAccountByKey(accountKey) {
  const accounts = getR2Accounts();
  if (!accountKey) return accounts[0];
  return accounts.find((account) => account.key === accountKey) || accounts[0];
}

function getAccountForBucket(bucketName) {
  if (!bucketName) return null;
  return getR2Accounts().find((account) => account.bucketName === bucketName) || null;
}

export function getR2Client(accountKey) {
  const account = getAccountByKey(accountKey);
  if (!clientsByAccountKey.has(account.key)) {
    clientsByAccountKey.set(
      account.key,
      new S3Client({
        region: "auto",
        endpoint: `https://${account.accountId}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: account.accessKeyId,
          secretAccessKey: account.secretAccessKey,
        },
      }),
    );
  }

  return clientsByAccountKey.get(account.key);
}

export function getR2BucketName(accountKey) {
  return getAccountByKey(accountKey).bucketName;
}

export function getR2PublicBaseUrl(accountKey) {
  return getAccountByKey(accountKey).publicBaseUrl || null;
}

export function getR2AccountCount() {
  return getR2Accounts().length;
}

export function getTotalR2StorageLimitBytes() {
  return getR2AccountCount() * R2_ACCOUNT_CAP_BYTES;
}

export function getR2UploadTarget(seed = "") {
  const accounts = getR2Accounts();
  if (accounts.length === 1) {
    const account = accounts[0];
    return {
      accountKey: account.key,
      bucketName: account.bucketName,
      publicBaseUrl: account.publicBaseUrl || null,
      client: getR2Client(account.key),
    };
  }

  const source = `${seed}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
  let hash = 0;
  for (let i = 0; i < source.length; i += 1) {
    hash = ((hash << 5) - hash + source.charCodeAt(i)) | 0;
  }
  const index = Math.abs(hash) % accounts.length;
  const selected = accounts[index];

  return {
    accountKey: selected.key,
    bucketName: selected.bucketName,
    publicBaseUrl: selected.publicBaseUrl || null,
    client: getR2Client(selected.key),
  };
}

export function resolveR2ForFile(file) {
  const byKey = file?.r2AccountKey ? getAccountByKey(file.r2AccountKey) : null;
  const account = byKey || getAccountForBucket(file?.bucket) || getAccountByKey();

  return {
    accountKey: account.key,
    bucketName: account.bucketName,
    publicBaseUrl: account.publicBaseUrl || null,
    client: getR2Client(account.key),
  };
}
