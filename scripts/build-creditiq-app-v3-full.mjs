import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDirectory, "..");
const sourceDirectory = resolve(projectRoot, "public/mockups/creditiq-app-v3");
const outputPath = resolve(projectRoot, "public/mockups/creditiq-app-editorial-v1.html");

const [html, css, javascript] = await Promise.all([
  readFile(resolve(sourceDirectory, "index.html"), "utf8"),
  readFile(resolve(sourceDirectory, "styles.css"), "utf8"),
  readFile(resolve(sourceDirectory, "app.js"), "utf8"),
]);

const bundledHtml = html
  .replace(
    '  <link rel="stylesheet" href="styles.css" />',
    `  <style>\n${css}\n  </style>`,
  )
  .replace(
    '  <script src="app.js"></script>',
    `  <script>\n${javascript.replaceAll("</script>", "<\\/script>")}\n  </script>`,
  );

if (bundledHtml === html || bundledHtml.includes('href="styles.css"') || bundledHtml.includes('src="app.js"')) {
  throw new Error("The prototype assets were not bundled into the HTML file.");
}

await writeFile(outputPath, bundledHtml, "utf8");
console.log(`Built ${outputPath}`);
