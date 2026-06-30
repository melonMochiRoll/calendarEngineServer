
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