import { Customer } from './entity/Customer';
import { conectarDB } from '../config/data-source';
import { Measure } from './entity/Measure';
import { RequestUploadModel } from './models/requestUploadModel';
import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from "@google/generative-ai";
import exp from 'constants';
import { ResponseUploadModel } from './models/responseUploadModel';
import { response } from 'express';

const dataSource = await conectarDB();
const customerRepository = dataSource.getRepository(Customer)
const measureRepository = dataSource.getRepository(Measure)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const safetySettings = [
    {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
    },
];

const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    safetySettings
});

export async function uploadImage(req, res) {
    const data: RequestUploadModel = req.body;
    let responseData: ResponseUploadModel = {
        measure_uuid: '',
        measure_value: '',
        image_url: ''
    };

    try {
        let validation = await validateUploadRequest(data);
        console.log(validation)
        if (validation) {
            return res.status(400).send(validation)
        }
        
        //consula o valor da medição
        let meter_value = await getImageMeasure(data.image);
        responseData.measure_value = meter_value;

        //salva/retorna se customer já existir
        const customer = new Customer();
        customer.customer_code = data.customer_code;
        const newCustomer = await saveOrReturnCustomer(customer);

        //depois de salvar retornar customer, salva nova medição no banco
        //falta validação de leiura mensal
        const measure = new Measure();
        measure.measure_type = data.measure_type
        measure.measure_datetime = data.measure_datetime
        measure.image_url = data.image
        measure.customer = newCustomer;

        const newMeasure = await saveMeasure(measure);
        responseData = {
            measure_value: meter_value,
            image_url: newMeasure.image_url,
            measure_uuid: newMeasure.measure_uuid,
        }

        return res.status(200).send({responseData})

    } catch (error) {
        res.status(500).send(error)
    }

}

export async function saveOrReturnCustomer(customer: Customer) {
    let res = await customerRepository.findOne({ where: { customer_code: customer.customer_code } })
    if (!res) {
        const newCustomer = await customerRepository.save(customer);
        return newCustomer;
    }

    return res;
}

export async function saveMeasure(measure: Measure) {
    const newMeasure = await measureRepository.save(measure);
    return newMeasure;
}

export async function UpdateMeasure(measure: Measure) {
    let res = await measureRepository.findOne({ where: { measure_uuid: measure.measure_uuid } })
    if (!res) {
        return false
    }
    const updateMeasure = await measureRepository.update(measure.measure_uuid, { has_confirmed: measure.has_confirmed });
    return updateMeasure;
}

export async function getImageMeasure(image: string) {

    try {

        const format_image = image.split(",");
        let image_data = {
            inlineData: {
                data: format_image[1],
                mimeType: "image/jpeg",
            }
        }

        const prompt = "pesquise mais sobre medidor de gas e retorne apenas o valor que indica a medida de uso";
        const result = await model.generateContent([image_data, prompt]);
        console.log(result.response.text());
        return result.response.text();

    } catch (error) {
        return error
    }
}

async function validateUploadRequest(data: RequestUploadModel) {

    const base64regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
    const format_image = data.image.split(",");

    // Validar o tipo de dados dos parâmetros enviados
    if (!data.image || !data.customer_code ||
        !data.measure_type || !data.measure_datetime) {
        console.log('alguma variavel vazio')
        return { error_code: "INVALID_DATA", error_description: 'Os dados fornecidos no corpo da requisição são inválidos' }
    }

    // (inclusive o base64)
    if (!base64regex.test(format_image[1])) {
        console.log('base64regex.test(data.image)', base64regex.test(data.image))
        return { error_code: "INVALID_DATA", error_description: 'Os dados fornecidos no corpo da requisição são inválidos' }
    }

    // Verificar se já existe uma leitura no mês naquele tipo de leitura
/*     if(validateMonthMeasure(data.measure_datetime)){
        return { error_code: "DOUBLE_REPORT", error_description: "Leitura do mês já realizada" }
    } */

    return false
}

async function validateMonthMeasure(date: Date){

    //precisa arrumar
    let formatedDate = new Date(date)
    let month = formatedDate.getMonth() + 1;
    const allRegisters = await dataSource.manager.query(`SELECT * FROM measure WHERE date_trunc('MONTH', measure_datetime)::date =  ${month}`)
    if(!allRegisters){
        return false
    }

    return true
}