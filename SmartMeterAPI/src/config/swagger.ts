const swaggerAutogen = require('swagger-autogen')({ openapi: '3.0.0' });

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
const endpointsFiles = ['../routes/*'];

swaggerAutogen(outputFile, endpointsFiles, doc).then(() => {
    require('../server.ts');  
});