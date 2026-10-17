const sharp = require('sharp');
const fs = require('fs');

async function testAnimatedWebp() {
  const width = 512;
  const height = 512;

  // Sharp creates multi-page images when stacking vertically:
  // e.g. An image of width 512, height 512 * numFrames, and then saving as WebP with pageHeight: 512
  const frames = [];
  const numFrames = 4;
  for (let i = 0; i < numFrames; i++) {
    const yOffset = Math.round(Math.sin((i / numFrames) * Math.PI * 2) * 8);
    const svg = `<svg width="${width}" height="${height}">
      <rect x="100" y="${100 + yOffset}" width="312" height="312" rx="30" fill="#3b82f6" />
    </svg>`;
    const frameBuf = await sharp({
      create: { width, height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }
    }).composite([{ input: Buffer.from(svg) }]).png().toBuffer();
    frames.push(frameBuf);
  }

  // Join vertically
  const tallBuffer = await sharp({
    create: { width, height: height * numFrames, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }
  }).composite(frames.map((buf, idx) => ({ input: buf, top: idx * height, left: 0 }))).png().toBuffer();

  const animatedWebp = await sharp(tallBuffer, { animated: false })
    .webp({
      pageHeight: height,
      loop: 0,
      delay: 200,
      quality: 80
    })
    .toBuffer();

  console.log('Animated WebP created successfully! Size:', animatedWebp.length, 'bytes');
  fs.writeFileSync('scratch/test_output_anim.webp', animatedWebp);
}

testAnimatedWebp().catch(console.error);
