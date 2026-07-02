
export function getOrigin() {
  return process.env.NODE_ENV === 'development' ? process.env.FRONT_SERVER_ORIGIN : process.env.SERVER_ORIGIN;
}

export function getR2PublicURL() {
  return process.env.R2_PUBLIC_URL;
}

export const chunking = <T>(array: Array<T>, size: number) => {
  const chunks: T[][] = [];

  for (let i=0; i<array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }

  return chunks;
}

export const getFullImageUrl = (value: string) => {
  if (!value) {
    return;
  }

  return `${getR2PublicURL()}/${value}`;
};

export const uuidToString = (value: Buffer) => {
  if (!value) {
    return;
  }

  const hex = value.toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
};

export const stringToUUID = (value: string) => {
  if (!value) {
    return;
  }

  return Buffer.from(value.replace(/-/g, ''), 'hex');
};