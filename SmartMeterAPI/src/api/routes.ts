import { Router } from 'express';
import { Customer } from './entity/Customer';
import {RequestUploadModel} from './models/requestUploadModel'
import { Measure } from './entity/Measure';
import * as controller from './controller';
export const router = Router();

router.post('/upload', controller.uploadImage)
router.patch('/confirm', controller.UpdateMeasureValue)
router.get('/:customer_code/list', controller.listCustomerMeasures)