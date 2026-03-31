# EstoqueOp Server — Deploy no VPS (aaPanel)

## 📦 Instalação

```bash
# 1. Upload esta pasta para seu VPS (ex: /www/estoqueop)
# 2. Instale as dependências
cd /www/estoqueop
npm install

# 3. Inicie o servidor
node server.js

# Ou com senha (recomendado)
PASSWORD=minhasenha PORT=3847 node server.js
```

## ▶️ Manter online com PM2

```bash
npm install -g pm2

# Sem senha
pm2 start server.js --name estoqueop

# Com senha
PASSWORD=minhasenha PORT=3847 pm2 start server.js --name estoqueop

pm2 save
pm2 startup
```

## 🌐 Configurar no aaPanel

1. aaPanel → **Website** → Add site → `estoqueop.seudominio.com`
2. SSL → Let's Encrypt gratuito
3. Configuração Nginx → adicione proxy reverso:

```nginx
location / {
    proxy_pass         http://127.0.0.1:3847;
    proxy_set_header   Host $host;
    proxy_set_header   X-Real-IP $remote_addr;
    proxy_set_header   Upgrade $http_upgrade;
    proxy_set_header   Connection "upgrade";
}
```

4. No app HTML → Config → URL: `https://estoqueop.seudominio.com`

## 📱 Usar no celular

Qualquer URL pública funciona: `http://SEU_IP:3847` ou via domínio.

## 📁 Estrutura

```
estoqueop-server/
├── server.js        ← servidor principal
├── package.json
├── data.json        ← criado automaticamente (backup este arquivo!)
└── public/
    └── index.html   ← opcional: coloque o HTML aqui para servir pelo servidor
```
