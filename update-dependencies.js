import fs from 'fs';
import path from 'path';

// Read the existing package.json
const packageJsonPath = path.join(__dirname, 'package.json');

try {
    // Check if package.json exists
    if (!fs.existsSync(packageJsonPath)) {
        console.error('Error: package.json not found in the current directory.');
        console.error('Make sure you are running this script from your project root.');
        process.exit(1);
    }

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

    // Add missing dependencies
    const newDependencies = {
        ...packageJson.dependencies || {},
        "livekit-server-sdk": "^1.2.6",
    };

    // Add missing devDependencies
    const newDevDependencies = {
        ...packageJson.devDependencies || {},
        "autoprefixer": "^10.4.14",
        "postcss": "^8.4.24",
        "tailwindcss": "^3.3.2",
    };

    packageJson.dependencies = newDependencies;
    packageJson.devDependencies = newDevDependencies;

    // Write the updated package.json
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

    console.log('package.json has been updated with missing dependencies.');
    console.log('Run "npm install" to install the new dependencies.');
} catch (error) {
    console.error('Error updating package.json:', error.message);
    process.exit(1);
}
