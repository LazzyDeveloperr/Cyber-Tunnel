export const pathShaderChunk = `
uniform float uDistance;

vec2 getPath(float y) {
  float t = y * 0.015 + uDistance * 0.5;
  // Multiple combined sine waves for natural-looking turns
  float x = sin(t) * 12.0 + cos(t * 0.6) * 8.0;
  float z = cos(t * 0.8) * 10.0 + sin(t * 0.4) * 6.0;
  return vec2(x, z);
}
`;

export function getPathJS(y: number, distance: number) {
  const t = y * 0.015 + distance * 0.5;
  const x = Math.sin(t) * 12.0 + Math.cos(t * 0.6) * 8.0;
  const z = Math.cos(t * 0.8) * 10.0 + Math.sin(t * 0.4) * 6.0;
  return { x, z };
}
