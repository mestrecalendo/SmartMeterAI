# SmartMeterAI
  serviço que gerencia a leitura individualizada de consumo de água e gás. Para facilitar a coleta da informação, o serviço utiliza IA(<a href="https://gemini.google.com/?hl=pt-BR">Google Gemini</a>) para obter a medição através da foto de um medidor.

## 🛠️ Construído com

Backend:
- Node.js > v.22
- Docker
- TypeORM
- Typescript
- Postgres

## ⚙️ Como rodar o projeto
 
O projeto foi feito com o docker e <a href="https://docs.docker.com/compose/">docker-compose</a>, então só é necessário:

1 - Definir o arquivo .env, como o exemplo disponibilizado;

2 - Acessar o diretório "SmartMeterAPI" e rodar o comando abaixo:

```
docker-compose -d build
```