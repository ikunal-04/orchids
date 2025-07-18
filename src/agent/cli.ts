// src/agent/cli.ts
import { Command } from 'commander';
import { runDatabaseAgent } from './index';
import * as fs from 'fs/promises';
import * as path from 'path';
import { spawn } from 'child_process';
import * as readline from 'readline';

const program = new Command();

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

// Enhanced command execution with interactive support
function executeCommand(command: string, interactive = false): Promise<void> {
    return new Promise((resolve, reject) => {
        console.log(`\n[CLI] 🚀 Running command: $ ${command}`);
        
        const [cmd, ...args] = command.split(' ');
        
        const childProcess = spawn(cmd, args, {
            cwd: process.cwd(),
            env: { ...process.env },
            stdio: interactive ? 'inherit' : 'pipe' 
        });

        if (!interactive) {
            childProcess.stdout?.pipe(process.stdout);
            childProcess.stderr?.pipe(process.stderr);
        }

        childProcess.on('close', (code) => {
            if (code === 0) {
                console.log(`[CLI] ✅ Command finished successfully.`);
                resolve();
            } else {
                console.error(`[CLI] ❌ Command failed with exit code ${code}.`);
                reject(new Error(`Command failed: ${command}`));
            }
        });

        childProcess.on('error', (err) => {
            console.error(`[CLI] ❌ Failed to start command: ${err.message}`);
            reject(err);
        });
    });
}

// Check if a command is interactive (needs user input)
function isInteractiveCommand(command: string): boolean {
    const interactiveCommands = [
        'drizzle-kit generate',
        'drizzle-kit push',
        'drizzle-kit migrate',
        'drizzle-kit studio'
    ];
    
    return interactiveCommands.some(cmd => command.includes(cmd));
}

// Enhanced file writing with better error handling
async function writeFile(filePath: string, content: string) {
    try {
        // Ensure directory exists
        const dir = path.dirname(filePath);
        await fs.mkdir(dir, { recursive: true });
        
        // Write the new content
        await fs.writeFile(filePath, content, 'utf-8');
        console.log(`✅ Successfully wrote to ${filePath}`);
    } catch (error) {
        console.error(`❌ Failed to write to ${filePath}:`, error);
        throw error;
    }
}

// Enhanced validation function
async function validateProjectStructure() {
    const requiredFiles = [
        'package.json',
        'src/app/page.tsx'
    ];
    
    console.log('[CLI] 🔍 Validating project structure...');
    
    for (const file of requiredFiles) {
        try {
            await fs.access(file);
            console.log(`✅ Found: ${file}`);
        } catch (error) {
            console.error(`❌ Missing required file: ${file}`);
            console.error('Please run this tool from the root of a Next.js project.');
            return false;
        }
    }
    
    // Check if it's a Next.js project
    try {
        const packageJson = JSON.parse(await fs.readFile('package.json', 'utf-8'));
        if (!packageJson.dependencies?.next) {
            console.error('❌ This doesn\'t appear to be a Next.js project.');
            return false;
        }
        console.log(`✅ Next.js project detected: ${packageJson.dependencies.next}`);
    } catch (error) {
        console.error('❌ Error reading package.json');
        return false;
    }
    
    return true;
}

// Check environment setup
async function checkEnvironment() {
    console.log('[CLI] 🔍 Checking environment...');
    
    // Check package manager
    const packageManager = await detectPackageManager();
    console.log(`✅ Package manager detected: ${packageManager}`);
    
    // Check for environment variables
    if (!process.env.GEMINI_API_KEY) {
        console.error('❌ GEMINI_API_KEY environment variable is not set');
        console.error('Please set it in your .env file or environment');
        return false;
    }
    console.log('✅ GEMINI_API_KEY is set');
    
    // Check for database setup
    const hasSchema = await fs.access('src/db/schema.ts').then(() => true).catch(() => false);
    const hasDbIndex = await fs.access('src/db/index.ts').then(() => true).catch(() => false);
    const hasDrizzleConfig = await fs.access('drizzle.config.ts').then(() => true).catch(() => false);
    
    if (!hasSchema || !hasDbIndex || !hasDrizzleConfig) {
        console.log('⚠️  Database setup incomplete - agent will create necessary files');
    } else {
        console.log('✅ Database setup appears complete');
    }
    
    return true;
}

program
    .version("1.0.0")
    .description("An AI agent to handle database tasks in a Next.js project.");

program
    .command('run')
    .description('Execute a database-related query.')
    .argument('<query>', 'The feature you want to implement')
    .option('-y, --yes', 'Skip confirmation prompts')
    .option('--dry-run', 'Show what would be done without actually doing it')
    .option('--no-backup', 'Skip creating backup files')
    .option('--auto-confirm', 'Automatically confirm drizzle schema changes')
    .action(async (query, options) => {
        console.log('🚀 Orchids Database Agent Starting...\n');
        
        // Validate project structure
        if (!(await validateProjectStructure())) {
            return;
        }
        
        // Check environment
        if (!(await checkEnvironment())) {
            return;
        }
        
        console.log(`[CLI] 📝 Processing query: "${query}"`);
        
        // Run the database agent
        const response = await runDatabaseAgent(query);

        if (!response || !response.files_to_modify) {
            console.error("\n[CLI] ❌ Agent failed to generate a valid plan. Aborting.");
            return;
        }

        // Display the plan
        console.log("\n[CLI] 📋 The agent has generated the following plan:");
        console.log("=" .repeat(60));
        
        response.plan.forEach((step: string, index: number) => {
            console.log(`${index + 1}. ${step}`);
        });
        
        console.log("\n[CLI] 📁 Files to be modified/created:");
        response.files_to_modify.forEach((file: any) => {
            console.log(`- ${file.filePath}`);
        });

        if (response.commands_to_run && response.commands_to_run.length > 0) {
            console.log("\n[CLI] 🔧 Commands to be executed:");
            response.commands_to_run.forEach((cmd: string) => {
                console.log(`- ${cmd}`);
            });
        }

        console.log("=" .repeat(60));

        // Dry run mode
        if (options.dryRun) {
            console.log("\n[CLI] 👀 DRY RUN MODE - No changes will be made.");
            console.log("Remove --dry-run flag to apply changes.");
            
            // Show file previews in dry run
            console.log("\n[CLI] 📄 File previews:");
            for (const file of response.files_to_modify) {
                console.log(`\n--- ${file.filePath} ---`);
                console.log(file.newContent.substring(0, 500) + (file.newContent.length > 500 ? '\n...' : ''));
                console.log(`--- End of ${file.filePath} ---`);
            }
            return;
        }

        // Confirmation prompt (unless --yes flag is used)
        if (!options.yes) {
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });

            const answer = await new Promise<string>((resolve) => {
                rl.question('\n[CLI] ❓ Do you want to proceed with these changes? (y/N): ', resolve);
            });

            rl.close();

            if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
                console.log('[CLI] ❌ Operation cancelled by user.');
                return;
            }
        }

        // Apply file modifications
        if (response.files_to_modify && response.files_to_modify.length > 0) {
            console.log("\n[CLI] 📝 Applying file modifications...");
            
            for (const file of response.files_to_modify) {
                try {
                    await writeFile(file.filePath, file.newContent);
                } catch (error) {
                    console.error(`[CLI] ❌ Failed to write ${file.filePath}. Aborting.`);
                    return;
                }
            }
        }

        // Execute commands with enhanced handling
        if (response.commands_to_run && response.commands_to_run.length > 0) {
            console.log("\n[CLI] 🔧 Executing post-modification commands...");
            
            for (const command of response.commands_to_run) {
                try {
                    const isInteractive = isInteractiveCommand(command);
                    
                    if (isInteractive) {
                        console.log(`[CLI] 🤖 Interactive command detected: ${command}`);
                        
                        if (options.autoConfirm && command.includes('drizzle-kit')) {
                            console.log(`[CLI] 🤖 Auto-confirming drizzle schema changes...`);
                            // For drizzle commands, we can add --yes flag or use environment variable
                            const modifiedCommand = command.includes('generate') 
                                ? `${command} --yes` 
                                : command;
                            await executeCommand(modifiedCommand, false);
                        } else {
                            console.log(`[CLI] 🤖 This command requires your input. Please respond to any prompts.`);
                            await executeCommand(command, true);
                        }
                    } else {
                        await executeCommand(command, false);
                    }
                } catch (error) {
                    console.error(`[CLI] ❌ Command failed: ${command}`);
                    console.error(`[CLI] Error: ${error}`);
                    console.error(`[CLI] 💡 You may need to run it manually`);
                    
                    // Ask if user wants to continue
                    if (!options.yes) {
                        const rl = readline.createInterface({
                            input: process.stdin,
                            output: process.stdout
                        });

                        const continueAnswer = await new Promise<string>((resolve) => {
                            rl.question('[CLI] ❓ Continue with remaining commands? (y/N): ', resolve);
                        });

                        rl.close();

                        if (continueAnswer.toLowerCase() !== 'y' && continueAnswer.toLowerCase() !== 'yes') {
                            console.log('[CLI] ❌ Stopping execution.');
                            return;
                        }
                    }
                }
            }
        }

        console.log("\n[CLI] ✨ Agent has finished executing the plan!");
        console.log("[CLI] 🎉 Your database feature should now be integrated into the frontend.");
        console.log("[CLI] 💡 Try running your Next.js app to see the changes:");
        
        const packageManager = await detectPackageManager();
        console.log(`   ${packageManager} run dev`);
        console.log("\n[CLI] 🔄 If something doesn't work, check the console for errors and try:");
        console.log(`   ${packageManager} run build`);
    });

// Enhanced status command (keeping the existing one but adding database migration status)
program
    .command('status')
    .description('Check the current project status and database setup')
    .action(async () => {
        console.log('🔍 Checking project status...\n');
        
        // ... (keep all existing status code)
        
        // Check package manager
        const packageManager = await detectPackageManager();
        console.log(`📦 Package manager: ${packageManager}`);
        
        // Check if this is a Next.js project
        try {
            const packageJson = JSON.parse(await fs.readFile('package.json', 'utf-8'));
            console.log(`✅ Project: ${packageJson.name || 'Unnamed'}`);
            console.log(`✅ Next.js: ${packageJson.dependencies?.next || 'Not found'}`);
            
            // Check for database-related dependencies
            const dbDeps = [
                'drizzle-orm',
                'drizzle-kit',
                '@neondatabase/serverless',
                'postgres',
                'pg'
            ];
            
            console.log('\n📊 Database dependencies:');
            dbDeps.forEach(dep => {
                const installed = packageJson.dependencies?.[dep] || packageJson.devDependencies?.[dep];
                console.log(`${installed ? '✅' : '❌'} ${dep}: ${installed || 'Not installed'}`);
            });
            
            // Check for database setup
            const hasSchema = await fs.access('src/db/schema.ts').then(() => true).catch(() => false);
            const hasDbIndex = await fs.access('src/db/index.ts').then(() => true).catch(() => false);
            const hasDrizzleConfig = await fs.access('drizzle.config.ts').then(() => true).catch(() => false);
            
            console.log('\n🗄️  Database setup:');
            console.log(`${hasSchema ? '✅' : '❌'} Schema: ${hasSchema ? 'Found' : 'Not found'}`);
            console.log(`${hasDbIndex ? '✅' : '❌'} Connection: ${hasDbIndex ? 'Found' : 'Not found'}`);
            console.log(`${hasDrizzleConfig ? '✅' : '❌'} Drizzle config: ${hasDrizzleConfig ? 'Found' : 'Not found'}`);
            
            // Check for migration files
            const hasMigrations = await fs.access('drizzle').then(() => true).catch(() => false);
            console.log(`${hasMigrations ? '✅' : '❌'} Migrations: ${hasMigrations ? 'Found' : 'Not found'}`);
            
            // Check for API routes
            const apiDir = await fs.readdir('src/app/api').catch(() => []);
            console.log(`\n🔗 API routes: ${apiDir.length} found`);
            if (apiDir.length > 0) {
                apiDir.forEach(route => {
                    console.log(`  - /api/${route}`);
                });
            }
            
            // Check environment
            console.log('\n🌍 Environment:');
            console.log(`${process.env.GEMINI_API_KEY ? '✅' : '❌'} GEMINI_API_KEY: ${process.env.GEMINI_API_KEY ? 'Set' : 'Not set'}`);
            console.log(`${process.env.DATABASE_URL ? '✅' : '❌'} DATABASE_URL: ${process.env.DATABASE_URL ? 'Set' : 'Not set'}`);
            
        } catch (error) {
            console.error('❌ Not a valid Node.js project or missing package.json');
        }
    });

// Add migration command for manual database operations
program
    .command('migrate')
    .description('Run database migrations manually')
    .option('--generate', 'Generate new migration files')
    .option('--push', 'Push schema changes to database')
    .option('--auto-confirm', 'Automatically confirm schema changes')
    .action(async (options) => {
        console.log('🗄️  Running database migrations...\n');
        
        const packageManager = await detectPackageManager();
        
        try {
            if (options.generate) {
                console.log('[CLI] 📝 Generating migration files...');
                const command = options.autoConfirm 
                    ? `${packageManager} drizzle-kit generate --yes`
                    : `${packageManager} drizzle-kit generate`;
                await executeCommand(command, !options.autoConfirm);
            }
            
            if (options.push) {
                console.log('[CLI] 📤 Pushing schema changes to database...');
                const command = options.autoConfirm 
                    ? `${packageManager} drizzle-kit push --yes`
                    : `${packageManager} drizzle-kit push`;
                await executeCommand(command, !options.autoConfirm);
            }
            
            if (!options.generate && !options.push) {
                console.log('[CLI] 📝 Running full migration process...');
                
                // Generate first
                console.log('[CLI] Step 1: Generating migration files...');
                const generateCommand = options.autoConfirm 
                    ? `${packageManager} drizzle-kit generate --yes`
                    : `${packageManager} drizzle-kit generate`;
                await executeCommand(generateCommand, !options.autoConfirm);
                
                // Then push
                console.log('[CLI] Step 2: Pushing schema changes...');
                const pushCommand = options.autoConfirm 
                    ? `${packageManager} drizzle-kit push --yes`
                    : `${packageManager} drizzle-kit push`;
                await executeCommand(pushCommand, !options.autoConfirm);
            }
            
            console.log('\n✅ Database migrations completed successfully!');
            
        } catch (error) {
            console.error('❌ Migration failed:', error);
            console.log('\n💡 Possible solutions:');
            console.log('1. Check your DATABASE_URL environment variable');
            console.log('2. Ensure your database is running and accessible');
            console.log('3. Try running migrations manually:');
            console.log(`   ${packageManager} drizzle-kit generate`);
            console.log(`   ${packageManager} drizzle-kit push`);
        }
    });

// Keep existing cleanup command
program
    .command('cleanup')
    .description('Clean up backup files created by the agent')
    .option('--dry-run', 'Show what would be cleaned without actually doing it')
    .action(async (options) => {
        console.log('🧹 Cleaning up backup files...\n');
        
        async function findBackups(dir: string): Promise<string[]> {
            const backups: string[] = [];
            try {
                const entries = await fs.readdir(dir, { withFileTypes: true });
                for (const entry of entries) {
                    const fullPath = path.join(dir, entry.name);
                    if (entry.isDirectory()) {
                        const subBackups = await findBackups(fullPath);
                        backups.push(...subBackups);
                    } else if (entry.name.includes('.backup-')) {
                        backups.push(fullPath);
                    }
                }
            } catch (error) {
                // Directory doesn't exist or can't be read
            }
            return backups;
        }
        
        const backupFiles = await findBackups('.');
        
        if (backupFiles.length === 0) {
            console.log('✅ No backup files found');
            return;
        }
        
        console.log(`Found ${backupFiles.length} backup files:`);
        backupFiles.forEach(file => console.log(`  - ${file}`));
        
        if (options.dryRun) {
            console.log('\n👀 DRY RUN MODE - No files would be deleted');
            return;
        }
        
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        const answer = await new Promise<string>((resolve) => {
            rl.question('\n❓ Delete these backup files? (y/N): ', resolve);
        });

        rl.close();

        if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
            console.log('❌ Cleanup cancelled');
            return;
        }
        
        for (const file of backupFiles) {
            try {
                await fs.unlink(file);
                console.log(`✅ Deleted: ${file}`);
            } catch (error) {
                console.error(`❌ Failed to delete: ${file}`);
            }
        }
        
        console.log('\n✨ Cleanup complete!');
    });

program.parse(process.argv);