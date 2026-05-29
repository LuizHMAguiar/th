const express = require("express");
const path = require("path");

const app = express();

console.log("PASTA:", __dirname);

app.use(express.static(path.join(__dirname, "public")));

// CACHE em memória
let cache = [];
let lastUpdate = 0;
let updating = false;

const LIMITE = 60 * 60 * 1000; // 1 hora

// função que sincroniza com Internet Archive
async function syncArchive() {

    if (updating) return;
    updating = true;

    try {

        console.log("Atualizando Internet Archive...");

        const response = await fetch(
            "https://archive.org/metadata/ps3_jogos"
        );

        const data = await response.json();

        cache = data.files || [];
        lastUpdate = Date.now();

        console.log("Cache atualizado:", cache.length, "arquivos");

    } catch (err) {
        console.log("Erro sync:", err.message);
    }

    updating = false;
}

app.get("/api/jogos", async (req, res) => {

    const agora = Date.now();

    // se nunca atualizou ou passou do tempo
    if (agora - lastUpdate > LIMITE) {
        syncArchive(); // roda em background
    }

    // responde imediatamente (cache antigo ou vazio)
    res.json(cache);
});

// força atualização manual (útil para debug)
app.get("/api/atualizar", async (req, res) => {

    await syncArchive();

    res.json({
        status: "ok",
        total: cache.length
    });
});

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// IMPORTANTE: permite acesso PS3 na rede
app.listen(3000, "0.0.0.0", () => {
    console.log("Rodando em http://localhost:3000");
});