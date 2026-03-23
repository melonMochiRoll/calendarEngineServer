
export function getOrigin() {
  return process.env.NODE_ENV === 'development' ? process.env.FRONT_SERVER_ORIGIN : process.env.SERVER_ORIGIN;
}