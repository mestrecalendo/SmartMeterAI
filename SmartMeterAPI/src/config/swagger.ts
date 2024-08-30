import swaggerAutogen from 'swagger-autogen';

const doc = {
    info: {
        version: "1.0.0",
        title: "SmartMeterAPI",
        description: "serviço que gerencia a leitura individualizada de consumo de água e gás."
    },
    servers: [
        {
            url: 'http://localhost:3000'
        }
    ]
};

const outputFile = './swagger.json';
const endpointsFiles = ['../api/routes.ts'];

swaggerAutogen(outputFile, endpointsFiles, doc);