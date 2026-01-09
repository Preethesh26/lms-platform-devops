const JavaScriptObfuscator = require('javascript-obfuscator');
const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');

const sourceDir = './';
const outputDir = './dist';

// Options for obfuscation - making it hard to read while keeping performance
const obfuscatorOptions = {
    compact: true,
    controlFlowFlattening: true,
    controlFlowFlatteningThreshold: 0.75,
    numbersToExpressions: true,
    simplify: true,
    stringArrayThreshold: 0.75,
    splitStrings: true,
    splitStringsChunkLength: 10,
    unicodeEscapeSequence: false // Keeps it compatible with standard shells
};

async function obfuscateProject() {
    console.log('🚀 Starting Backend Obfuscation...');

    // Clean dist folder
    if (fs.existsSync(outputDir)) {
        fs.removeSync(outputDir);
    }
    fs.ensureDirSync(outputDir);

    // Find all .js files excluding node_modules, dist, and this script
    const files = glob.sync('**/*.js', {
        ignore: [
            'node_modules/**',
            'dist/**',
            'obfuscate.js',
            'package.json',
            'package-lock.json',
            '.env'
        ]
    });

    console.log(`📦 Found ${files.length} files to process.`);

    for (const file of files) {
        const sourcePath = path.join(sourceDir, file);
        const destinationPath = path.join(outputDir, file);

        // Ensure destination directory exists
        fs.ensureDirSync(path.dirname(destinationPath));

        const code = fs.readFileSync(sourcePath, 'utf8');

        console.log(`   🔒 Obfuscating: ${file}`);

        try {
            const obfuscatedCode = JavaScriptObfuscator.obfuscate(code, obfuscatorOptions).getObfuscatedCode();
            fs.writeFileSync(destinationPath, obfuscatedCode);
        } catch (err) {
            console.error(`   ❌ Error obfuscating ${file}:`, err);
            // Fallback: Copy as is if obfuscation fails (rare)
            fs.copySync(sourcePath, destinationPath);
        }
    }

    // Copy non-JS files (package.json, models that might be non-JS, etc. - though here mostly .js)
    // For this LMS, we need package.json in dist for deployment
    fs.copySync('package.json', path.join(outputDir, 'package.json'));
    if (fs.existsSync('.env.example')) {
        fs.copySync('.env.example', path.join(outputDir, '.env.example'));
    }

    console.log('✅ Obfuscation Complete! Your production code is in /dist');
}

obfuscateProject().catch(console.error);
