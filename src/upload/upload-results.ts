/**
 * Upload test results to GitHub repository
 */

import { Octokit } from '@octokit/rest';
import * as fs from 'fs/promises';
import * as path from 'path';
import { TestResult } from '../common/utils';

const RESULTS_REPO_OWNER = 'WebView-CG';
const RESULTS_REPO_NAME = 'webview-bcd-results';

interface UploadOptions {
  token: string;
  resultsPath: string;
  branch?: string;
}

/**
 * Upload test results to GitHub repository
 */
export async function uploadResults(options: UploadOptions): Promise<void> {
  const { token, resultsPath, branch = 'main' } = options;
  
  const octokit = new Octokit({ auth: token });
  
  // Read results file
  const resultsContent = await fs.readFile(resultsPath, 'utf-8');
  const results: TestResult = JSON.parse(resultsContent);
  
  // Create filename with timestamp and platform
  const timestamp = new Date(results.timestamp).toISOString().replace(/[:.]/g, '-');
  const filename = `${results.platform}-${timestamp}.json`;
  const filePath = `results/${filename}`;
  
  console.log(`Uploading results to ${RESULTS_REPO_OWNER}/${RESULTS_REPO_NAME}/${filePath}`);
  
  try {
    // Check if file already exists
    let sha: string | undefined;
    try {
      const { data } = await octokit.repos.getContent({
        owner: RESULTS_REPO_OWNER,
        repo: RESULTS_REPO_NAME,
        path: filePath,
        ref: branch,
      });
      if ('sha' in data) {
        sha = data.sha;
      }
    } catch (error: any) {
      if (error.status !== 404) {
        throw error;
      }
      // File doesn't exist, that's fine
    }
    
    // Create or update file
    await octokit.repos.createOrUpdateFileContents({
      owner: RESULTS_REPO_OWNER,
      repo: RESULTS_REPO_NAME,
      path: filePath,
      message: `Add ${results.platform} test results - ${results.deviceModel} - ${results.webviewVersion}\n\nCo-authored-by: GitHub Copilot <copilot@github.com>`,
      content: Buffer.from(resultsContent).toString('base64'),
      branch,
      ...(sha && { sha }),
    });
    
    console.log(`✓ Results uploaded successfully to ${filePath}`);
    
    // Also update latest results
    await uploadLatestResults(octokit, results, branch);
    
  } catch (error) {
    console.error('Failed to upload results:', error);
    throw error;
  }
}

/**
 * Update the latest results file for quick access
 */
async function uploadLatestResults(
  octokit: Octokit,
  results: TestResult,
  branch: string
): Promise<void> {
  const latestPath = `results/latest-${results.platform}.json`;
  
  let sha: string | undefined;
  try {
    const { data } = await octokit.repos.getContent({
      owner: RESULTS_REPO_OWNER,
      repo: RESULTS_REPO_NAME,
      path: latestPath,
      ref: branch,
    });
    if ('sha' in data) {
      sha = data.sha;
    }
  } catch (error: any) {
    if (error.status !== 404) {
      throw error;
    }
  }
  
  await octokit.repos.createOrUpdateFileContents({
    owner: RESULTS_REPO_OWNER,
    repo: RESULTS_REPO_NAME,
    path: latestPath,
    message: `Update latest ${results.platform} results\n\nCo-authored-by: GitHub Copilot <copilot@github.com>`,
    content: Buffer.from(JSON.stringify(results, null, 2)).toString('base64'),
    branch,
    ...(sha && { sha }),
  });
  
  console.log(`✓ Updated latest results at ${latestPath}`);
}

/**
 * CLI script to upload results
 */
async function main() {
  const token = process.env.GITHUB_TOKEN;
  
  if (!token) {
    console.error('Error: GITHUB_TOKEN environment variable not set');
    process.exit(1);
  }
  
  const resultsPath = process.argv[2] || 'test-results/results.json';
  
  if (!(await fs.stat(resultsPath).catch(() => false))) {
    console.error(`Error: Results file not found: ${resultsPath}`);
    process.exit(1);
  }
  
  await uploadResults({
    token,
    resultsPath,
    branch: process.env.RESULTS_BRANCH || 'main',
  });
}

if (require.main === module) {
  main().catch(error => {
    console.error('Upload failed:', error);
    process.exit(1);
  });
}
