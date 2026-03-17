import * as fs from 'fs';
import * as path from 'path';
import { createRequire } from 'module';

type PrettierModule = {
  format(
    source: string,
    options: Record<string, unknown>,
  ): Promise<string> | string;
  resolveConfig(filePath: string): Promise<Record<string, unknown> | null>;
};

type ESLintModule = {
  ESLint: new (options: { cwd: string; fix: boolean }) => {
    lintText(
      source: string,
      options: { filePath: string },
    ): Promise<Array<{ output?: string }>>;
  };
};

const PRETTIER_CONFIG_FILES = [
  '.prettierrc',
  '.prettierrc.json',
  '.prettierrc.yml',
  '.prettierrc.yaml',
  '.prettierrc.js',
  '.prettierrc.cjs',
  '.prettierrc.mjs',
  '.prettierrc.toml',
  'prettier.config.js',
  'prettier.config.cjs',
  'prettier.config.mjs',
] as const;

const ESLINT_CONFIG_FILES = [
  'eslint.config.js',
  'eslint.config.cjs',
  'eslint.config.mjs',
  '.eslintrc',
  '.eslintrc.js',
  '.eslintrc.cjs',
  '.eslintrc.json',
  '.eslintrc.yaml',
  '.eslintrc.yml',
] as const;

export class GeneratedFileFormatter {
  constructor(private readonly outputPath: string) {}

  async format(sourceText: string) {
    const prettierConfigPath = this.findNearestToolConfig(
      PRETTIER_CONFIG_FILES,
    );
    if (prettierConfigPath) {
      try {
        const prettier = this.loadProjectModule<PrettierModule>(
          'prettier',
          prettierConfigPath,
        );
        if (prettier) {
          const prettierConfig =
            (await prettier.resolveConfig(this.outputPath)) ?? {};
          return await prettier.format(sourceText, {
            ...prettierConfig,
            filepath: this.outputPath,
            parser: 'typescript',
          });
        }
      } catch {
        // Ignore formatter setup issues in the target repo and try the next option.
      }
    }

    const eslintConfigPath = this.findNearestToolConfig(ESLINT_CONFIG_FILES);
    if (eslintConfigPath) {
      try {
        const eslintModule = this.loadProjectModule<ESLintModule>(
          'eslint',
          eslintConfigPath,
        );
        if (eslintModule && this.canRunEslint(eslintConfigPath)) {
          const eslint = new eslintModule.ESLint({
            cwd: path.dirname(eslintConfigPath),
            fix: true,
          });
          const [result] = await eslint.lintText(sourceText, {
            filePath: this.outputPath,
          });
          if (typeof result?.output === 'string') {
            return result.output;
          }
        }
      } catch {
        // Ignore formatter setup issues in the target repo and keep the generated output.
      }
    }

    return sourceText;
  }

  private findNearestToolConfig(configFileNames: readonly string[]) {
    let currentDir = path.dirname(path.resolve(this.outputPath));

    while (true) {
      for (const configFileName of configFileNames) {
        const configPath = path.join(currentDir, configFileName);
        if (fs.existsSync(configPath)) {
          return configPath;
        }
      }

      const packageJsonPath = path.join(currentDir, 'package.json');
      if (fs.existsSync(packageJsonPath)) {
        try {
          const packageJson = JSON.parse(
            fs.readFileSync(packageJsonPath, 'utf-8'),
          ) as Record<string, unknown>;

          if (
            configFileNames === PRETTIER_CONFIG_FILES &&
            packageJson.prettier !== undefined
          ) {
            return packageJsonPath;
          }

          if (
            configFileNames === ESLINT_CONFIG_FILES &&
            packageJson.eslintConfig !== undefined
          ) {
            return packageJsonPath;
          }
        } catch {
          // Ignore invalid package.json files and continue walking upward.
        }
      }

      const parentDir = path.dirname(currentDir);
      if (parentDir === currentDir) {
        return null;
      }
      currentDir = parentDir;
    }
  }

  private loadProjectModule<T>(moduleName: string, fromFilePath: string) {
    try {
      const projectRequire = createRequire(fromFilePath);
      return projectRequire(moduleName) as T;
    } catch {
      return null;
    }
  }

  private canRunEslint(eslintConfigPath: string) {
    if (path.basename(eslintConfigPath) === 'package.json') {
      return true;
    }

    const projectRequire = this.createProjectRequire(eslintConfigPath);
    if (!projectRequire) {
      return false;
    }

    for (const packageName of this.getImportedPackageNames(eslintConfigPath)) {
      try {
        projectRequire.resolve(packageName);
      } catch {
        return false;
      }
    }

    return true;
  }

  private getImportedPackageNames(configPath: string) {
    const configContent = fs.readFileSync(configPath, 'utf-8');
    const packageNames = new Set<string>();
    const importPatterns = [
      /import\s+(?:[^'"]+?\s+from\s+)?['"]([^'"]+)['"]/g,
      /require\(\s*['"]([^'"]+)['"]\s*\)/g,
    ];

    for (const pattern of importPatterns) {
      for (const match of configContent.matchAll(pattern)) {
        const packageName = this.getBarePackageName(match[1]);
        if (packageName) {
          packageNames.add(packageName);
        }
      }
    }

    return packageNames;
  }

  private getBarePackageName(specifier: string) {
    if (
      !specifier ||
      specifier.startsWith('.') ||
      specifier.startsWith('/') ||
      specifier.startsWith('node:')
    ) {
      return null;
    }

    if (specifier.startsWith('@')) {
      const [scope, name] = specifier.split('/');
      return scope && name ? `${scope}/${name}` : specifier;
    }

    return specifier.split('/')[0];
  }

  private createProjectRequire(fromFilePath: string) {
    try {
      return createRequire(fromFilePath);
    } catch {
      return null;
    }
  }
}
