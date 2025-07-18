import { GoogleGenAI } from "@google/genai";
import * as fs from 'fs/promises';
import * as path from 'path';
import 'dotenv/config';

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

// Detect package manager
async function detectPackageManager(): Promise<string> {
    try {
        await fs.access('bun.lock');
        return 'bun';
    } catch {
        try {
            await fs.access('yarn.lock');
            return 'yarn';
        } catch {
            try {
                await fs.access('pnpm-lock.yaml');
                return 'pnpm';
            } catch {
                return 'npm';
            }
        }
    }
}

// Check if dependency is already installed
async function isDependencyInstalled(packageName: string): Promise<boolean> {
    try {
        const packageJson = await fs.readFile('package.json', 'utf-8');
        const pkg = JSON.parse(packageJson);
        return !!(pkg.dependencies?.[packageName] || pkg.devDependencies?.[packageName]);
    } catch {
        return false;
    }
}

// Smart context gathering with token optimization
async function gatherSmartContext(userQuery: string) {
    console.log('[AGENT] Gathering optimized project context...');
    
    const context: any = {
        projectStructure: '',
        relevantComponents: {},
        schema: '',
        mainPage: '',
        packageInfo: '',
        apiRoutes: [],
        drizzleConfig: '',
        packageManager: 'npm'
    };

    try {
        // Detect package manager
        context.packageManager = await detectPackageManager();
        console.log(`[AGENT] Detected package manager: ${context.packageManager}`);
        
        // 1. Read essential files only
        context.schema = await fs.readFile('src/db/schema.ts', 'utf-8').catch(() => '');
        context.mainPage = await fs.readFile('src/app/page.tsx', 'utf-8').catch(() => '');
        context.drizzleConfig = await fs.readFile('drizzle.config.ts', 'utf-8').catch(() => '');
        
        // 2. Read package.json but extract only relevant info
        const packageJson = await fs.readFile('package.json', 'utf-8').catch(() => '{}');
        const pkg = JSON.parse(packageJson);
        context.packageInfo = {
            name: pkg.name,
            dependencies: Object.keys(pkg.dependencies || {}),
            devDependencies: Object.keys(pkg.devDependencies || {}),
            packageManager: context.packageManager
        };
        
        // 3. Smart component selection based on query
        const relevantPaths = getRelevantPaths(userQuery);
        for (const componentPath of relevantPaths) {
            try {
                const content = await fs.readFile(componentPath, 'utf-8');
                // Truncate very long files to first 2000 chars
                context.relevantComponents[componentPath] = content.length > 2000 
                    ? content.substring(0, 2000) + '\n// ... (truncated for brevity)' 
                    : content;
            } catch (error) {
                // File doesn't exist, skip
            }
        }
        
        // 4. Generate minimal project structure
        context.projectStructure = await generateMinimalStructure();
        
        // 5. Check for existing API routes (just list them)
        context.apiRoutes = await listApiRoutes();
        
    } catch (error) {
        console.warn('[AGENT] Error gathering context:', error);
    }
    
    return context;
}

// Determine relevant file paths based on user query
function getRelevantPaths(query: string): string[] {
    const allPaths = [
        'src/app/page.tsx',
        'src/app/layout.tsx',
        'src/components/Sidebar.tsx',
        'src/components/MainContent.tsx',
        'src/components/TopBar.tsx',
        'src/components/Player.tsx',
        'src/components/PlaylistCard.tsx',
        'src/components/SongCard.tsx',
        'src/components/AlbumCard.tsx'
    ];
    
    const queryLower = query.toLowerCase();
    
    // Smart filtering based on query content
    if (queryLower.includes('recently played') || queryLower.includes('recent')) {
        return allPaths.filter(p => 
            p.includes('page.tsx') || 
            p.includes('MainContent') || 
            p.includes('SongCard') ||
            p.includes('Player')
        );
    }
    
    if (queryLower.includes('made for you') || queryLower.includes('popular') || queryLower.includes('album')) {
        return allPaths.filter(p => 
            p.includes('page.tsx') || 
            p.includes('MainContent') || 
            p.includes('AlbumCard') ||
            p.includes('PlaylistCard')
        );
    }
    
    if (queryLower.includes('playlist')) {
        return allPaths.filter(p => 
            p.includes('page.tsx') || 
            p.includes('Sidebar') || 
            p.includes('PlaylistCard')
        );
    }
    
    // Default: return most important files
    return [
        'src/app/page.tsx',
        'src/components/MainContent.tsx',
        'src/components/Sidebar.tsx'
    ];
}

// Generate minimal project structure
async function generateMinimalStructure(): Promise<string> {
    const structure = [];
    
    try {
        // Just show the key directories
        structure.push('src/');
        structure.push('  app/');
        structure.push('    page.tsx');
        structure.push('    layout.tsx');
        structure.push('    api/ (for API routes)');
        structure.push('  components/');
        
        // List component files
        const componentFiles = await fs.readdir('src/components').catch(() => []);
        componentFiles.forEach(file => {
            if (file.endsWith('.tsx') || file.endsWith('.ts')) {
                structure.push(`    ${file}`);
            }
        });
        
        structure.push('  db/');
        structure.push('    schema.ts');
        structure.push('    index.ts');
        
    } catch (error) {
        structure.push('Error reading project structure');
    }
    
    return structure.join('\n');
}

// List existing API routes
async function listApiRoutes(): Promise<string[]> {
    try {
        const apiDir = 'src/app/api';
        const entries = await fs.readdir(apiDir, { withFileTypes: true }).catch(() => []);
        
        const routes: string[] = [];
        for (const entry of entries) {
            if (entry.isDirectory()) {
                routes.push(`/api/${entry.name}`);
            }
        }
        
        return routes;
    } catch (error) {
        return [];
    }
}

// Add retry logic for rate limiting
async function callGeminiWithRetry(prompt: string, maxRetries = 3): Promise<any> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`[AGENT] Attempt ${attempt}/${maxRetries} - Contacting Gemini...`);
            
            const response = await genAI.models.generateContentStream({
                model: "gemini-2.5-pro",
                contents: prompt,
                config: {
                    thinkingConfig: {
                        includeThoughts: true,
                    },
                },
            });
            
            return response;
            
        } catch (error: any) {
            if (error.status === 429 && attempt < maxRetries) {
                const waitTime = Math.pow(2, attempt) * 1000;
                console.log(`[AGENT] Rate limited. Waiting ${waitTime/1000}s before retry...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
                continue;
            }
            throw error;
        }
    }
}

// Optimized agent function
export async function runDatabaseAgent(userQuery: string) {
    console.log(`[AGENT] Received query: "${userQuery}"`);
    
    // Gather smart, optimized context
    const context = await gatherSmartContext(userQuery);
    
    // Create optimized prompt
    const prompt = `
    You are an expert full-stack developer specializing in Next.js, TypeScript, and Drizzle ORM.
    You're working on a Spotify clone and need to implement database features with frontend integration.
    
    **CRITICAL REQUIREMENTS:**
    1. Use ${context.packageInfo.packageManager} as the package manager (detected: ${context.packageInfo.packageManager})
    2. Only install dependencies that are NOT already installed
    3. MUST integrate backend APIs into existing frontend components
    4. Keep existing UI/UX design intact - only add data fetching functionality
    5. Use simple, functional implementation - no complex user management needed
    6. Focus on displaying the requested data in the existing UI components
    
    **ALREADY INSTALLED DEPENDENCIES:**
    ${context.packageInfo.dependencies.concat(context.packageInfo.devDependencies).join(', ')}
    
    **PROJECT CONTEXT:**
    
    Package Manager: ${context.packageInfo.packageManager}
    
    Structure:
    ${context.projectStructure}
    
    Drizzle Config:
    \`\`\`typescript
    ${context.drizzleConfig}
    \`\`\`
    
    Current Schema:
    \`\`\`typescript
    ${context.schema}
    \`\`\`
    
    Main Page:
    \`\`\`tsx
    ${context.mainPage}
    \`\`\`
    
    Relevant Components:
    ${Object.entries(context.relevantComponents).map(([path, content]) => 
        `**${path}:**\n\`\`\`tsx\n${content}\n\`\`\`\n`
    ).join('\n')}
    
    Existing API Routes: ${context.apiRoutes.join(', ') || 'None'}
    
    **USER REQUEST:** "${userQuery}"
    
    **RESPONSE FORMAT (JSON only):**
    {
      "plan": ["step 1", "step 2", ...],
      "files_to_modify": [
        {
          "filePath": "path/to/file",
          "newContent": "complete file content"
        }
      ],
      "commands_to_run": ["command1", "command2"]
    }
    
    **COMMAND GENERATION RULES:**
    - Use "${context.packageInfo.packageManager}" instead of npm
    - Only include install commands for dependencies NOT in the existing dependencies list
    - For drizzle commands, use: "${context.packageInfo.packageManager} drizzle-kit generate" and "${context.packageInfo.packageManager} drizzle-kit push"
    - For running scripts, use: "${context.packageInfo.packageManager} run <script>" or "${context.packageInfo.packageManager} <script>"
    
    **IMPLEMENTATION REQUIREMENTS:**
    1. Create/update database schema in src/db/schema.ts
    2. Create API endpoints in src/app/api/[route]/route.ts
    3. Modify existing components to fetch and display data from the new APIs
    4. Add proper TypeScript types
    5. Include loading states and error handling
    6. Use existing UI components and styling
    7. Populate tables with sample data that matches the Spotify theme
    8. Ensure the frontend actually calls the new APIs and displays the data
    
    **SAMPLE DATA REQUIREMENTS:**
    - For recently played songs: include realistic song names, artists, album covers, duration
    - For albums/playlists: include realistic album names, artist names, cover images, descriptions
    - Use placeholder images or realistic URLs for album covers
    
    Generate a complete, working implementation that will immediately work in the existing Spotify clone UI.
    `;

    let thoughts = "";
    let answer = "";

    try {
        // Call Gemini with retry logic
        const response = await callGeminiWithRetry(prompt);
        
        console.log('[AGENT] Processing response...');

        // Collect response chunks
        for await (const chunk of response) {
            const candidates = chunk.candidates ?? [];
            for (const candidate of candidates) {
                const content = candidate.content;
                if (!content || !content.parts) continue;
                for (const part of content.parts) {
                    if (!part?.text) {
                        continue;
                    } else if (part.thought) {
                        if (!thoughts) {
                            console.log("🤔 Agent thoughts:");
                        }
                        console.log(part.text);
                        thoughts = thoughts + part.text;
                    } else {
                        if (!answer) {
                            console.log("📋 Agent plan:");
                        }
                        console.log(part.text);
                        answer = answer + part.text;
                    }
                }
            }
        }

        // Parse and return response
        const responseText = answer || "";

        if (!responseText.trim()) {
            console.error("[AGENT] Error: Empty response from LLM");
            return null;
        }

        // Clean the response to ensure it's valid JSON
        let jsonString = responseText.replace(/```json|```/g, '').trim();
        
        // Try to extract JSON if it's embedded in other text
        const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            jsonString = jsonMatch[0];
        }

        try {
            const parsedResponse = JSON.parse(jsonString);
            
            // Validate response structure
            if (!parsedResponse.plan || !Array.isArray(parsedResponse.plan)) {
                console.error("[AGENT] Invalid response: missing or invalid plan");
                return null;
            }
            
            if (!parsedResponse.files_to_modify || !Array.isArray(parsedResponse.files_to_modify)) {
                console.error("[AGENT] Invalid response: missing or invalid files_to_modify");
                return null;
            }
            
            // Filter out already installed dependencies from commands
            if (parsedResponse.commands_to_run) {
                const filteredCommands = [];
                for (const cmd of parsedResponse.commands_to_run) {
                    if (cmd.includes('install')) {
                        // Extract package name from install command
                        const packageMatch = cmd.match(/install.*?([a-zA-Z0-9@\-_\/]+)/);
                        if (packageMatch) {
                            const packageName = packageMatch[1].replace(/^@types\//, '').replace(/^-D\s+/, '');
                            const isInstalled = await isDependencyInstalled(packageName) || 
                                               await isDependencyInstalled(`@types/${packageName}`);
                            if (!isInstalled) {
                                filteredCommands.push(cmd);
                            } else {
                                console.log(`[AGENT] Skipping ${packageName} - already installed`);
                            }
                        } else {
                            filteredCommands.push(cmd);
                        }
                    } else {
                        filteredCommands.push(cmd);
                    }
                }
                parsedResponse.commands_to_run = filteredCommands;
            }
            
            console.log('\n[AGENT] 📋 Execution plan received:');
            parsedResponse.plan.forEach((step: string, index: number) => {
                console.log(`${index + 1}. ${step}`);
            });
            
            console.log('\n[AGENT] 📁 Files to be modified:');
            parsedResponse.files_to_modify.forEach((file: any) => {
                console.log(`- ${file.filePath}`);
            });
            
            if (parsedResponse.commands_to_run && parsedResponse.commands_to_run.length > 0) {
                console.log('\n[AGENT] 🔧 Commands to run:');
                parsedResponse.commands_to_run.forEach((cmd: string) => {
                    console.log(`- ${cmd}`);
                });
            }
            
            return parsedResponse;
        } catch (error) {
            console.error("[AGENT] Error parsing LLM response:", error);
            console.log("Raw response:", responseText);
            console.log("Cleaned JSON string:", jsonString);
            return null;
        }
        
    } catch (error: any) {
        if (error.status === 429) {
            console.error("\n[AGENT] ❌ Rate limit exceeded. Solutions:");
            console.error("1. Wait a few minutes and try again");
            console.error("2. Upgrade to paid Gemini API plan");
            console.error("3. Use a different model (gemini-1.5-flash is cheaper)");
            console.error("4. Break your query into smaller parts");
        } else {
            console.error("[AGENT] Error calling Gemini:", error);
        }
        return null;
    }
}