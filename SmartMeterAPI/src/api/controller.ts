import { Customer } from './entity/Customer';
import { conectarDB } from '../config/data-source';
import { Measure } from './entity/Measure';
import { RequestUploadModel } from './models/requestUploadModel';
import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from "@google/generative-ai";
import { ResponseUploadModel } from './models/responseUploadModel';
import { RequestConfirmModel } from './models/requestConfirmModel';
import { ResponseConfirmModel } from './models/responseConfirmModel';
import { ResponseListMeasureModel } from './models/responseListMeasureModel';
import { Like } from 'typeorm';


const dataSource = await conectarDB();
const customerRepository = dataSource.getRepository(Customer)
const measureRepository = dataSource.getRepository(Measure)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const aceptedFormats = ["image/png","image/jpeg","image/webp", "image/heic","image/heif"];

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
        measure_value: 0,
        image_url: ''
    };

    try {
        let validation = await validateUploadRequest(data);
        if (validation) {
            return res.status(400).send(validation)
        }

        //consula o valor da medição
        let meter_value = await getImageMeasure(data.image);
        var formatedMeterValue = meter_value.replace(/\D/g, "");
        responseData.measure_value = formatedMeterValue;

        //salva/retorna se customer já existir
        const customer = new Customer();
        customer.customer_code = data.customer_code;
        const newCustomer = await saveOrReturnCustomer(customer);

        //depois de salvar retornar customer, salva nova medição no banco
        //falta validação de leiura mensal
        const measure = new Measure();
        measure.measure_type = data.measure_type
        measure.measure_value = formatedMeterValue;
        measure.measure_datetime = data.measure_datetime
        measure.image_url = data.image
        measure.customer = newCustomer;

        const newMeasure = await saveMeasure(measure);
        responseData = {
            measure_value: newMeasure.measure_value,
            image_url: newMeasure.image_url,
            measure_uuid: newMeasure.measure_uuid,
        }
 
        res.status(200).send({ responseData })

    } catch (error) {
        res.status(500).send(error)
    }

}

export async function UpdateMeasureValue(req, res) {
    const data: RequestConfirmModel = req.body;
    let responseData: ResponseConfirmModel = {
        success: false
    };

    try {
        let validation = await validateConfirmRequest(data);
        if (validation) {
            return res.status(400).send(validation)
        }

        let measure: Measure = await getMeasure(data.measure_uuid);
        if (!measure) {
            return res.status(404).send({ error_code: "MEASURE_NOT_FOUND", error_description: "Leitura não encontrada" })
        } else if (measure.has_confirmed) {
            return res.status(409).send({ error_code: "CONFIRMATION_DUPLICATE", error_description: "Leitura do mês já realizada" })
        }

        measure.has_confirmed = true;
        measure.measure_value = data.confirmed_value;
        await UpdateMeasure(measure);
        responseData.success = true;

        return res.status(200).send(responseData)

    } catch (error) {
        res.status(500).send(error)
    }
}

export async function listCustomerMeasures(req, res) {
    let id = req.params.customer_code;
    let { measure_type } = req.query

    let validation = await validateListMeasureRequest(id, measure_type)

    if (validation) {
        return res.status(400).send(validation)
    }

    let measureList = await getAllMeasures(id, measure_type)

    let list: ResponseListMeasureModel = {
        customer_code: id,
        measures: measureList,
    }

    if(measureList.length <= 0){
        return res.status(404).send({ error_code: "MEASURES_NOT_FOUND", error_description: "Nenhuma leitura encontrada"})
    }

    res.status(200).send(list)
}

async function saveOrReturnCustomer(customer: Customer) {
    let res = await customerRepository.findOne({ where: { customer_code: customer.customer_code } })
    if (!res) {
        const newCustomer = await customerRepository.save(customer);
        return newCustomer;
    }

    return res;
}

async function saveMeasure(measure: Measure) {
    const newMeasure = await measureRepository.save(measure);
    return newMeasure;
}

async function UpdateMeasure(measure: Measure) {
    const updateMeasure = await measureRepository.update(measure.measure_uuid, { has_confirmed: measure.has_confirmed, measure_value: measure.measure_value });
    return updateMeasure;
}

async function getMeasure(id: string) {
    try {
        let res = await measureRepository.findOne({ where: { measure_uuid: id } })
        return res
    } catch (error) {
        return
    }

}

async function getImageMeasure(image: string) {

    try {
        const format_image = image.split(",");
        
        let image_format = aceptedFormats.filter((format) => format_image[0].includes(format))

        let image_data = {
            inlineData: {
                data: format_image[1],
                mimeType: image_format[0]
            }
        }

        const prompt = "pesquise mais sobre medidor de gas e retorne apenas o valor que indica a medida de uso";
        const result = await model.generateContent([image_data, prompt]);
        return result.response.text();

    } catch (error) {
        return error
    }
}

async function getAllMeasures(customer_code: string, measure_type: string) {

    if(measure_type){
        return dataSource.manager.query(`SELECT * FROM Customer INNER JOIN  Measure  ON '${customer_code}' = Customer.customer_code WHERE Measure.measure_type = '${measure_type}'`)
    }

    return measureRepository.find({
        relations: { customer: false },
        where: [{customer: { customer_code: customer_code } }]
    })
}

async function validateUploadRequest(data: RequestUploadModel) {

    const base64regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
    const format_image = data.image.split(",");

    // Validar o tipo de dados dos parâmetros enviados
    if (!data.image || !data.customer_code ||
        !data.measure_type || !data.measure_datetime ||
        !(data.measure_type === "GAS" || data.measure_type === 'WATER')) {
        return { error_code: "INVALID_DATA", error_description: 'Os dados fornecidos no corpo da requisição são inválidos' }
    }

    // (inclusive o base64)
    if (!base64regex.test(format_image[1])) {
        return { error_code: "INVALID_DATA", error_description: 'Os dados fornecidos no corpo da requisição são inválidos' }
    }

    // Verificar se já existe uma leitura no mês naquele tipo de leitura
    let res = await filterMeasureByMonth(data.measure_datetime, data.measure_type)
    if(res.length > 0){
        return { error_code: "DOUBLE_REPORT", error_description: "Leitura do mês já realizada" }
    }

    //valida tipo de imagem aceita pelo gemini
    let image_format = aceptedFormats.filter((format) => format_image[0].includes(format))
    if(image_format.length <= 0){
        return { error_code: "INVALID_DATA", error_description: 'Os dados fornecidos no corpo da requisição são inválidos' }
    }

    return false
}

async function validateConfirmRequest(data: RequestConfirmModel) {
    // Validar o tipo de dados dos parâmetros enviados
    if ((!data.confirmed_value || (typeof data.confirmed_value !== "number")) || (!data.measure_uuid || (typeof data.measure_uuid !== "string"))) {
        return { error_code: "INVALID_DATA", error_description: 'Os dados fornecidos no corpo da requisição são inválidos' }
    }
}

async function validateListMeasureRequest(customer_code, measure_type) {
    if (measure_type) {
        if (!(measure_type === "GAS" || measure_type === 'WATER')) {
            return { error_code: "INVALID_TYPE", error_description: "Tipo de medição não permitida" }
        }
    }
    else if (!customer_code || (typeof customer_code !== "string")) {
        return { error_code: "INVALID_DATA", error_description: 'Os dados fornecidos são inválidos' }
    }

    return
}

async function filterMeasureByMonth(date: Date, measure_type:string) {
    let formatedDate = new Date(date)
    let month = formatedDate.getMonth() + 1;
    return await dataSource.manager.query(`SELECT * FROM measure WHERE EXTRACT('MONTH' FROM measure_datetime) = ${month} AND measure_type = '${measure_type}'`)
}