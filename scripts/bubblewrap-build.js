const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const BUBBLEWRAP_DIR = path.join(__dirname, '..', 'bubblewrap');
const KEYSTORE_DIR = path.join(BUBBLEWRAP_DIR, 'keystore');
const AAB_OUTPUT = path.join(BUBBLEWRAP_DIR, 'output.aab');
const PWABUILD_JSON = path.join(BUBBLEWRAP_DIR, 'pwabuild.json');

const config = {
  appVersionName: '1.0.0',
  appVersionCode: 1,
  webUrl: process.env.PWA_URL || 'https://thai-silver-saas.vercel.app',
  appName: 'SilverCare Thailand',
  shortName: 'SilverCare',
  appDescription: 'Premium Elderly Care Management Platform / แพลตฟอร์มจัดการดูแลผู้สูงอายุระดับพรีเมียม',
  manifestUrl: '/manifest.json',
  appUrl: '/th',
  signing: {
    keystorePath: path.join(KEYSTORE_DIR, 'silvercare-keystore.jks'),
    keystorePassword: process.env.KEYSTORE_PASSWORD || 'SilverCare2024!',
    keyAlias: 'silvercare',
    keyPassword: process.env.KEY_PASSWORD || 'SilverCare2024!',
  },
  icons: {
    adaptiveIcon: {
      foreground: path.join(__dirname, '..', 'public', 'icons', 'icon-512x512.png'),
      background: '#f8f9fa',
    },
  },
  splash: {
    backgroundColor: '#f8f9fa',
  },
  fallbackUrl: 'https://thai-silver-saas.vercel.app/th',
  enableNotifications: true,
  enableSiteSettings: true,
  appVersionName: '1.0.0',
  appVersionCode: 1,
};

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function generateKeystore() {
  ensureDir(KEYSTORE_DIR);
  const keystorePath = config.signing.keystorePath;
  if (!fs.existsSync(keystorePath)) {
    console.log('[Bubblewrap] Generating keystore...');
    execSync(
      `keytool -genkey -v -keystore "${keystorePath}" -alias ${config.signing.keyAlias} ` +
      `-keyalg RSA -keysize 2048 -validity 10000 ` +
      `-storepass ${config.signing.keystorePassword} ` +
      `-keypass ${config.signing.keyPassword} ` +
      `-dname "CN=SilverCare, OU=Engineering, O=SilverCare Thailand, L=Bangkok, ST=Bangkok, C=TH"`,
      { stdio: 'inherit' }
    );
  } else {
    console.log('[Bubblewrap] Keystore already exists, skipping generation.');
  }
}

function generatePwabuildJson() {
  console.log('[Bubblewrap] Generating pwabuild.json...');
  fs.writeFileSync(PWABUILD_JSON, JSON.stringify(config, null, 2));
}

async function buildAab() {
  console.log('[Bubblewrap] Running Bubblewrap build...');
  try {
    execSync(`npx @pwabuilder/cli build --config "${PWABUILD_JSON}" --out "${AAB_OUTPUT}"`, {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..'),
    });
    console.log(`[Bubblewrap] AAB generated at: ${AAB_OUTPUT}`);
    console.log('[Bubblewrap] Build complete!');
  } catch (err) {
    console.error('[Bubblewrap] Build failed:', err.message);
    console.log('[Bubblewrap] Attempting manual AAB packaging...');
    execSync(
      `npx bubblewrap build --keystorePath "${config.signing.keystorePath}" ` +
      `--keystorePass "${config.signing.keystorePassword}" ` +
      `--keyAlias "${config.signing.keyAlias}" ` +
      `--keyPass "${config.signing.keyPassword}" ` +
      `--appVersionName "${config.appVersionName}" ` +
      `--appVersionCode ${config.appVersionCode} ` +
      `--manifestUrl "${config.webUrl}${config.manifestUrl}"`,
      { stdio: 'inherit', cwd: path.join(__dirname, '..') }
    );
  }
}

async function main() {
  console.log('=== Bubblewrap PWA to Android AAB Builder ===');
  console.log(`PWABUILDER_DIR: ${BUBBLEWRAP_DIR}`);
  console.log(`AAB Output: ${AAB_OUTPUT}`);

  ensureDir(BUBBLEWRAP_DIR);
  generateKeystore();
  generatePwabuildJson();
  await buildAab();

  console.log('=== Build Complete ===');
  console.log(`Output file: ${AAB_OUTPUT}`);
  console.log(`Size: ${fs.existsSync(AAB_OUTPUT) ? (fs.statSync(AAB_OUTPUT).size / 1024 / 1024).toFixed(2) + ' MB' : 'N/A'}`);
}

main().catch(console.error);
