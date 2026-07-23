/**
 * SVG 로고를 오프스크린 캔버스에 그려 불투명 픽셀을 샘플링,
 * 파티클 타깃 좌표(Float32Array [x,y,z]*N)를 만든다.
 * 실패 시 원형 링 폴백.
 */
const cache = new Map<string, Float32Array>();

export async function sampleLogoPoints(
  url: string,
  count: number,
  worldSize = 10
): Promise<Float32Array> {
  const key = `${url}|${count}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const out = new Float32Array(count * 3);
  try {
    const img = await loadImage(url);
    const S = 200;
    const cv = document.createElement("canvas");
    cv.width = S;
    cv.height = S;
    const ctx = cv.getContext("2d", { willReadFrequently: true })!;
    // 로고를 정사각형 중앙에 맞춰 그림
    const ar = img.width / img.height;
    let w = S,
      h = S;
    if (ar > 1) h = S / ar;
    else w = S * ar;
    ctx.drawImage(img, (S - w) / 2, (S - h) / 2, w, h);
    const data = ctx.getImageData(0, 0, S, S).data;

    const px: number[] = [];
    for (let y = 0; y < S; y += 1) {
      for (let x = 0; x < S; x += 1) {
        if (data[(y * S + x) * 4 + 3] > 96) px.push(x, y);
      }
    }
    if (px.length < 40) throw new Error("empty silhouette");

    const n = px.length / 2;
    for (let i = 0; i < count; i++) {
      const j = Math.floor(Math.random() * n);
      const x = px[j * 2];
      const y = px[j * 2 + 1];
      out[i * 3] = ((x + Math.random() - 0.5) / S - 0.5) * worldSize;
      out[i * 3 + 1] = -((y + Math.random() - 0.5) / S - 0.5) * worldSize;
      out[i * 3 + 2] = (Math.random() - 0.5) * worldSize * 0.06;
    }
  } catch {
    // 폴백: 링
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      const r = worldSize * (0.32 + Math.random() * 0.1);
      out[i * 3] = Math.cos(a) * r;
      out[i * 3 + 1] = Math.sin(a) * r;
      out[i * 3 + 2] = (Math.random() - 0.5) * 0.5;
    }
  }
  cache.set(key, out);
  return out;
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = url;
  });
}
