import { Request, Response } from 'express';

import { container } from 'tsyringe';

import CreateOrderService from '@modules/orders/services/CreateOrderService';
import FindOrderService from '@modules/orders/services/FindOrderService';

export default class OrdersController {
  public async show(request: Request, response: Response): Promise<Response> {
    // TODO
    const { id } = request.params;
    const findorder = container.resolve(FindOrderService);

    const order = await findorder.execute({ id });

    return response.json(order);

  }

  public async create(request: Request, response: Response): Promise<Response> {
    // TODO
    const { customer_id, products } = request.body

    const createorder = container.resolve(CreateOrderService);

    const customer = await createorder.execute({
      customer_id, products
    })

    return response.json(customer);
  }
}
