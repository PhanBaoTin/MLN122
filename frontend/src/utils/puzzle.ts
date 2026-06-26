/**
 * Extracts a specific tile from an image using Canvas API.
 * Returns a Data URL (base64 string) of the cropped tile.
 */
export async function extractTile(
  imageUrl: string,
  gridSize: number,
  tileNumber: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous'; // Required if images are served from a different domain
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject('Failed to get canvas context');

      // The puzzle is square, we use the minimum dimension to make a square crop
      const size = Math.min(img.width, img.height);
      const startX = (img.width - size) / 2;
      const startY = (img.height - size) / 2;

      const tileSize = size / gridSize;
      canvas.width = tileSize;
      canvas.height = tileSize;

      // tileNumber 1...N^2-1
      // Calculate original row and col for this tileNumber
      const row = Math.floor((tileNumber - 1) / gridSize);
      const col = (tileNumber - 1) % gridSize;

      ctx.drawImage(
        img,
        startX + col * tileSize,
        startY + row * tileSize,
        tileSize,
        tileSize,
        0,
        0,
        tileSize,
        tileSize
      );

      resolve(canvas.toDataURL('image/jpeg', 0.9));
    };
    img.onerror = reject;
    img.src = imageUrl;
  });
}

/**
 * Pre-slice the entire image into tiles for faster rendering.
 */
export async function sliceImage(imageUrl: string, gridSize: number): Promise<Map<number, string>> {
  const tileMap = new Map<number, string>();
  const totalTiles = gridSize * gridSize - 1; // 0 is empty
  
  const promises = [];
  for (let i = 1; i <= totalTiles; i++) {
    promises.push(
      extractTile(imageUrl, gridSize, i).then(dataUrl => {
        tileMap.set(i, dataUrl);
      })
    );
  }
  
  await Promise.all(promises);
  return tileMap;
}
