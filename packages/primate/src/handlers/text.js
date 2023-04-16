export default (body, {status = 200} = {}) => (_, headers) => [
  body, {
    status,
    headers: {...headers, "Content-Type": "text/plain"},
  },
];