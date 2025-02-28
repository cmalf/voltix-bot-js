"use strict";

/**
########################################################
#                                                      #
#   CODE  : VOLTIX Bot v1.0.0                          #
#   NodeJs: v23.6.1                                    #
#   Author: Furqonflynn (cmalf)                        #
#   TG    : https://t.me/furqonflynn                   #
#   GH    : https://github.com/cmalf                   #
#                                                      #
########################################################
*/
/**
 * This code is open-source and welcomes contributions! 
 * 
 * If you'd like to add features or improve this code, please follow these steps:
 * 1. Fork this repository to your own GitHub account.
 * 2. Make your changes in your forked repository.
 * 3. Submit a pull request to the original repository. 
 * 
 * This allows me to review your contributions and ensure the codebase maintains high quality. 
 * 
 * Let's work together to improve this project!
 * 
 * P.S. Remember to always respect the original author's work and avoid plagiarism. 
 * Let's build a community of ethical and collaborative developers.
 */

const fs = require('fs');
const readline = require('readline');
const axios = require('axios');
const { HttpsProxyAgent } = require('https-proxy-agent');
const { SocksProxyAgent } = require('socks-proxy-agent');

let CoderMarkPrinted = false;

const TOKEN_FILE = 'accounts.txt';
const PROXY_FILE = 'proxy.txt';

const Colors = {
  Gold: "\x1b[38;5;220m",
  Red: "\x1b[31m",
  Teal: "\x1b[38;5;51m",
  Green: "\x1b[32m",
  Neon: "\x1b[38;5;198m",
  Blue: "\x1b[34m",
  Magenta: "\x1b[95m",
  Dim: "\x1b[2m",
  Yellow: "\x1b[33m",
  RESET: "\x1b[0m"
};

function CoderMark() {
  if (!CoderMarkPrinted) {
  console.log(`
╭━━━╮╱╱╱╱╱╱╱╱╱╱╱╱╱╭━━━┳╮
┃╭━━╯╱╱╱╱╱╱╱╱╱╱╱╱╱┃╭━━┫┃${Colors.Green}
┃╰━━┳╮╭┳━┳━━┳━━┳━╮┃╰━━┫┃╭╮╱╭┳━╮╭━╮
┃╭━━┫┃┃┃╭┫╭╮┃╭╮┃╭╮┫╭━━┫┃┃┃╱┃┃╭╮┫╭╮╮${Colors.Blue}
┃┃╱╱┃╰╯┃┃┃╰╯┃╰╯┃┃┃┃┃╱╱┃╰┫╰━╯┃┃┃┃┃┃┃
╰╯╱╱╰━━┻╯╰━╯┣━━┻╯╰┻╯╱╱╰━┻━╮╭┻╯╰┻╯╰╯${Colors.RESET}
╱╱╱╱╱╱╱╱╱╱╱┃┃╱╱╱╱╱╱╱╱╱╱╭━╯┃${Colors.Blue}{${Colors.Neon}cmalf${Colors.Blue}}${Colors.RESET}
╱╱╱╱╱╱╱╱╱╱╱╰╯╱╱╱╱╱╱╱╱╱╱╰━━╯
\n${Colors.RESET}VOLTIX Bot ${Colors.Blue}{ ${Colors.Neon}JS${Colors.Blue} }${Colors.RESET}
    \n${Colors.Green}${'―'.repeat(50)}
    \n${Colors.Gold}[+]${Colors.RESET} DM : ${Colors.Teal}https://t.me/furqonflynn
    \n${Colors.Gold}[+]${Colors.RESET} GH : ${Colors.Teal}https://github.com/cmalf/
    \n${Colors.Green}${'―'.repeat(50)}
    \n${Colors.Gold}]-> ${Colors.Blue}{ ${Colors.RESET}BOT${Colors.Neon} v1.0.0${Colors.Blue} } ${Colors.RESET}
    \n${Colors.Green}${'―'.repeat(50)}
    `);
        CoderMarkPrinted = true;
    }
}

class ProxyError extends Error {
  constructor(message, proxy) {
    super(message);
    this.name = "ProxyError";
    this.proxy = proxy;
  }
}

function maskAddress(address) {
  if (!address || address.length <= 12) return address;
  return address.substring(0, 6) + ":::" + address.substring(address.length - 6);
}

function loadTokens() {
  try {
    const content = fs.readFileSync(TOKEN_FILE, 'utf8');
    return content.split('\n').map(line => line.trim()).filter(Boolean);
  } catch (error) {
    console.error(Colors.Red, 'Error loading tokens:', error.message, Colors.RESET);
    return [];
  }
}

function loadProxies() {
  try {
    const content = fs.readFileSync(PROXY_FILE, 'utf8');
    return content.split('\n').map(line => line.trim()).filter(Boolean);
  } catch (error) {
    console.error(Colors.Red, 'Error loading proxies:', error.message, Colors.RESET);
    return [];
  }
}

function getRandomProxy(proxies) {
  if (!proxies.length) return null;
  return proxies[Math.floor(Math.random() * proxies.length)];
}

async function createProxyAgent(proxy) {
  if (!proxy) {
    throw new ProxyError("Proxy URL is required", proxy);
  }
  try {
    if (proxy.startsWith("http://") || proxy.startsWith("https://")) {
      return new HttpsProxyAgent(proxy);
    }
    if (proxy.startsWith("socks://") || proxy.startsWith("socks5://")) {
      return new SocksProxyAgent(proxy);
    }
    throw new ProxyError(`Unsupported proxy protocol: ${proxy}`, proxy);
  } catch (error) {
    if (error instanceof ProxyError) {
      throw error;
    }
    throw new ProxyError(`Failed to create proxy agent: ${error.message}`, proxy);
  }
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchUserIdentity(account) {
  try {
    const response = await account.api.get('/users');
    if (response.data && response.data.data && response.data.data.raw_address) {
      account.raw_address = response.data.data.raw_address;
    } else {
      console.error(`${Colors.Red}Failed to retrieve identity data for an account.${Colors.RESET}`);
    }
  } catch (error) {
    console.error(`${Colors.Red}Error fetching user identity: ${error.message}${Colors.RESET}`);
  }
}

async function claimTaskWithRetry(taskId, account, maxRetries = 3) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const claimResponse = await account.api.post(`/user-tasks/social/${taskId}/claim`);
      return claimResponse;
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      console.log(`${Colors.Yellow}Retry attempt ${attempt + 1} for task ${taskId}${Colors.RESET}`);
      await sleep(5000);
    }
  }
}

async function completeTask(category, account) {
  if (!account.raw_address) {
    await fetchUserIdentity(account);
  }
  const maskedAddr = maskAddress(account.raw_address);
  console.log(`${Colors.Neon}]> ${Colors.RESET}Processing Account: ${Colors.Teal}${maskedAddr}${Colors.RESET}`);
  console.log(`${Colors.Neon}]> ${Colors.Gold}Starting Voltix Bot to Complete Task (${category === 'ONE' ? 'Once Time' : 'Daily'})${Colors.RESET}`);
  
  try {
    const tasksResponse = await account.api.get('/tasks/socials');
    const allTasks = tasksResponse.data.data.filter(task => task.category === category);

    const completedResponse = await account.api.get('/user-tasks/social/completed');
    let completedTasks = completedResponse.data.data;

    const tasksToClaim = completedTasks.filter(t => t.status === 'COMPLETED');
    for (const t of tasksToClaim) {
      console.log(`\n${Colors.RESET}${maskedAddr}${Colors.Teal} ]> Task ${Colors.Neon}${t.task_id}${Colors.RESET} has status COMPLETED, attempting claim...`);
      await sleep(5000);
      try {
        const claimResp = await claimTaskWithRetry(t.task_id, account);
        if (claimResp.data && claimResp.data.data === 1) {
          console.log(`${Colors.RESET}${maskedAddr}${Colors.Teal} ]> ${Colors.Green}Successfully claimed completed task ${Colors.Neon}${t.task_id}${Colors.RESET}\n`);
        } else {
          console.log(`${Colors.RESET}${maskedAddr}${Colors.Teal} ]> ${Colors.Red}Failed to claim completed task ${Colors.Neon}${t.task_id}${Colors.RESET}\n`);
        }
      } catch (error) {
        console.log(`${Colors.RESET}${maskedAddr}${Colors.Teal} ]> ${Colors.Red}Error claiming completed task ${Colors.Neon}${t.task_id}: ${Colors.Red}${error.message}${Colors.RESET}`);
      }
    }

    const newCompletedResponse = await account.api.get('/user-tasks/social/completed');
    completedTasks = newCompletedResponse.data.data;

    const tasksToProcess = allTasks.filter(task => {
      const completedTask = completedTasks.find(t => t.task_id === task.id);
      return !(completedTask && completedTask.status === 'CLAIMED');
    });

    if (tasksToProcess.length === 0) {
      console.log(`\n${Colors.Yellow}No More Tasks for account: ${Colors.Teal}${maskedAddr}${Colors.RESET}! All tasks complete.\n`);
      return;
    }

    const failedTasks = [];
    for (const task of tasksToProcess) {
      try {
        const verifyResponse = await account.api.post(`/user-tasks/social/verify/${task.id}`, {});
        if (verifyResponse.data.data.status === 'IN_PROGRESS') {
          console.log(`\n${Colors.Dim}${'―'.repeat(50)}${Colors.RESET}`);
          console.log(`${Colors.RESET}${maskedAddr}${Colors.Teal} ]>${Colors.RESET} Processing Task ID: ${Colors.Neon}${task.id}${Colors.RESET}`);
          console.log(`${Colors.RESET}${maskedAddr}${Colors.Teal} ]>${Colors.RESET} Task: ${Colors.Neon}${task.title}${Colors.RESET}`);
          console.log(`\n${Colors.Dim}${'―'.repeat(50)}${Colors.RESET}`);

          await sleep(30000);
          try {
            const claimResponse = await claimTaskWithRetry(task.id, account);
            if (claimResponse.data && claimResponse.data.data === 1) {
              const newCompletedResponse = await account.api.get('/user-tasks/social/completed');
              const newCompletedTask = newCompletedResponse.data.data.find(t => t.task_id === task.id);
              if (newCompletedTask && newCompletedTask.status === 'CLAIMED') {
                console.log(`${Colors.Teal}[${maskedAddr}]> ${Colors.Green}Task successfully claimed${Colors.RESET}\n`);
              } else {
                console.log(`${Colors.Teal}[${maskedAddr}]> ${Colors.Red}Task claim verification failed${Colors.RESET}\n`);
                failedTasks.push(task.id);
              }
            }
          } catch (claimError) {
            console.log(`${Colors.Teal}[${maskedAddr}]> ${Colors.Red}Error claiming task: ${task.id}${Colors.RESET}`);
            failedTasks.push(task.id);
          }
        }
      } catch (error) {
        console.log(`${Colors.Teal}[${maskedAddr}]> ${Colors.Red}Error processing task: ${task.id}${Colors.RESET}`);
        failedTasks.push(task.id);
      }
    }

    if (failedTasks.length > 0) {
      console.log(`${Colors.Red}[${maskedAddr}]> Retrying failed tasks: ${failedTasks.join(', ')}${Colors.RESET}`);
      await completeTask(category, account);
    }
  } catch (error) {
    console.error(`${Colors.Red}[${maskedAddr}]> Error: ${error.message}${Colors.RESET}`);
  }
}

async function fetchRewards(account) {
  if (!account.raw_address) {
    await fetchUserIdentity(account);
  }
  const maskedAddr = maskAddress(account.raw_address);
  try {
    const response = await account.api.get('/stat/rewards');
    if (response.data && response.data.data) {
      const rewards = response.data.data;
      const totalPoints = rewards.reduce((sum, reward) => sum + (reward.total_points || 0), 0);

      console.log(`\n${Colors.Dim}${'―'.repeat(50)}${Colors.RESET}`);
      console.log(`${Colors.RESET}Account Address: ${Colors.Teal}${maskedAddr}${Colors.RESET}`);
      console.log(`${Colors.RESET}Total Points   : ${Colors.Green}${totalPoints}${Colors.RESET} PTS`);
      console.log(`${Colors.Dim}${'―'.repeat(50)}${Colors.RESET}\n`);
    }
  } catch (error) {
    console.error(`${Colors.Red}[${maskedAddr}]> Error fetching rewards: ${error.message}${Colors.RESET}`);
  }
}

function showMenu(accounts) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log(`\n${Colors.Teal}=== Voltix Task Automation ===${Colors.RESET}\n`);
  console.log(`${Colors.Gold}1. ${Colors.RESET}Complete Main Tasks`);
  console.log(`${Colors.Gold}2. ${Colors.RESET}Complete Daily Tasks`);
  console.log(`${Colors.Gold}3. ${Colors.Red}Exit${Colors.RESET}\n`);

  rl.question('Select option: ', async (answer) => {
    let category;
    switch (answer.trim()) {
      case '1':
        console.clear();
        category = 'ONE';
        break;
      case '2':
        console.clear();
        category = 'DAILY';
        break;
      case '3':
        console.log(`${Colors.Teal}Goodbye!${Colors.RESET}`);
        process.exit(0);
        break;
      default:
        console.log(`${Colors.Red}Invalid option${Colors.RESET}`);
        rl.close();
        return showMenu(accounts);
    }

    // Process each account sequentially.
    for (const account of accounts) {
      await fetchUserIdentity(account);
      await fetchRewards(account);
      await completeTask(category, account);
    }

    rl.close();
    // Redisplay the menu after processing.
    showMenu(accounts);
  });
}

// Main function to initialize accounts.
async function main() {
  const tokens = loadTokens();
  const proxies = loadProxies();

  if (tokens.length === 0) {
    console.error(Colors.Red, 'No tokens found. Exiting.', Colors.RESET);
    process.exit(1);
  }

  const accounts = [];

  for (const token of tokens) {
    let agent = null;
    const proxyUrl = getRandomProxy(proxies);
    if (proxyUrl) {
      try {
        agent = await createProxyAgent(proxyUrl);
      } catch (error) {
        console.error(`${Colors.Red}Error with proxy: ${error.message}${Colors.RESET}`);
      }
    }
    const instanceConfig = {
      baseURL: 'https://api.voltix.ai',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };
    if (agent) {
      instanceConfig.httpAgent = agent;
      instanceConfig.httpsAgent = agent;
    }
    const apiInstance = axios.create(instanceConfig);
    accounts.push({
      token,
      api: apiInstance,
      proxy: proxyUrl || "None"
    });
  }

  if (accounts.length === 0) {
    console.error(`${Colors.Red}No valid accounts loaded. Exiting.${Colors.RESET}`);
    process.exit(1);
  }
  showMenu(accounts);
}

console.clear();
CoderMark();
main();
