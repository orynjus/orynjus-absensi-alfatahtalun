const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const SRC = path.join(__dirname, "../client/public/favicon.png");
const OUT = path.join(__dirname, "../client/public/icons");

if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

async function generate() {
  for (const size of sizes) {
    await sharp(SRC)
      .resize(size, size, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .png()
      .toFile(path.join(OUT, `icon-${size}.png`));
    console.log(`✓ icon-${size}.png`);
  }

  for (const size of [192, 512]) {
    await sharp(SRC)
      .resize(Math.round(size * 0.8), Math.round(size * 0.8), { fit: "contain", background: { r: 29, g: 78, b: 216, alpha: 1 } })
      .extend({
        top: Math.round(size * 0.1),
        bottom: Math.round(size * 0.1),
        left: Math.round(size * 0.1),
        right: Math.round(size * 0.1),
        background: { r: 29, g: 78, b: 216, alpha: 1 },
      })
      .resize(size, size)
      .png()
      .toFile(path.join(OUT, `icon-maskable-${size}.png`));
    console.log(`✓ icon-maskable-${size}.png`);
  }

  await sharp(SRC)
    .resize(390, 844, { fit: "contain", background: { r: 239, g: 246, b: 255, alpha: 1 } })
    .png()
    .toFile(path.join(OUT, "screenshot-mobile.png"));
  console.log("✓ screenshot-mobile.png");

  console.log("\nSemua ikon berhasil dibuat di client/public/icons/");
}

generate().catch(console.error);
