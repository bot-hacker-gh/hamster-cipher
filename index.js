const { setTimeout } = require("timers/promises");
const { randomInt } = require("crypto");
const { urlParseHashParams } = require("./utils");

try {
  const input = process.env.TOKEN;

const urlRexExp = new RegExp(
  /https?:\/\/(www.)?[-a-zA-Z0-9@:%._+~#=]{1,256}.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&\/\/=]*)/gi
);
console.log(input);
const url = input.match(urlRexExp)[0];
const hash = new URL(url).hash;
const initData = urlParseHashParams(hash).tgWebAppData;

const sleepRandom = async (ms, accuracy = ms / 5) => await setTimeout(randomInt(ms - accuracy, ms + accuracy));

class User {
  constructor(initData) {
    this.initData = initData;
  }

  async login() {
    const response = await fetch("https://api.hamsterkombatgame.io/auth/auth-by-telegram-webapp", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ initDataRaw: this.initData }),
    });
    const rawToken = await response.json();
    this.token = "Bearer " + rawToken.authToken;
    console.log("https://api.hamsterkombatgame.io/auth/auth-by-telegram-webapp  " + response.status);
  }

  async post(url, body = {}) {
    const result = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: this.token,
      },
      body: JSON.stringify(body),
    });

    console.log(url + "  " + result.status);
    return await result.json();
  }

  async sync() {
    await this.post("https://api.hamsterkombatgame.io/clicker/sync");
  }

  async getConfig() {
    const config = await this.post("https://api.hamsterkombatgame.io/clicker/config");
    this.cipherClaimed = config.dailyCipher.isClaimed;
    this.config = config;
  }

  async getCipher() {
    if (this.cipherClaimed) return;
    const cipherBase64 = this.config.dailyCipher.cipher;
    const cipher = atob(cipherBase64.slice(0, 3) + cipherBase64.slice(4));
    this.balance += 1_000_000;
    return await this.post("https://api.hamsterkombatgame.io/clicker/claim-daily-cipher", { cipher });
  }
}

async function main() {
  try {
    const user = new User(initData);
    await sleepRandom(60 * 1000, 30 * 1000);
    await user.login();
    await user.sync();
    await user.getConfig();
    await user.getCipher();
  } catch (err) {
    console.log(err);
  }
  console.log("completed");
}

main();
} catch (err) {
  console.log("error")
}
