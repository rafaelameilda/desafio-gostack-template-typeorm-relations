import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';

interface IProduct {
  id: string;
  quantity: number;
}

interface IRequest {
  customer_id: string;
  products: IProduct[];
}

@injectable()
class CreateOrderService {
  constructor(
    @inject('OrdersRepository')
    private ordersRepository: IOrdersRepository,
    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,
    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) { }

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    // TODO
    const customerExists = await this.customersRepository.findById(customer_id);

    if (!customerExists) {
      throw new AppError('could not find any customer with the given id')
    }

    const existemproducts = await this.productsRepository.findAllById(products);

    if (!existemproducts.length) {
      throw new AppError('could not find any products eith the given ids');
    }

    const existemproductsIds = existemproducts.map(product => product.id);

    const checkInexistentProducts = products.filter(
      product => !existemproductsIds.includes(product.id)
    );

    if (checkInexistentProducts.length) {
      throw new AppError(`could not find product ${checkInexistentProducts[0].id}`);
    }

    const findProductsWithNoQuantityAvailable = products.filter(
      product =>
        existemproducts.filter(p => p.id === product.id)[0].quantity < product.quantity,
    );

    if (findProductsWithNoQuantityAvailable.length) {
      throw new AppError(`the quantity ${findProductsWithNoQuantityAvailable[0].quantity}
       is not available for ${findProductsWithNoQuantityAvailable[0].id} `);
    }

    const serializedProducts = products.map(product => ({
      product_id: product.id,
      quantity: product.quantity,
      price: existemproducts.filter(p => p.id === product.id)[0].price
    }))

    const order = await this.ordersRepository.create({
      customer: customerExists,
      products: serializedProducts
    });

    const { order_products } = order;

    const orderProductQuantity = order_products.map(product => ({
      id: product.product_id,
      quantity:
        existemproducts.filter(p => p.id === product.product_id)[0].quantity - product.quantity,
    }));

    await this.productsRepository.updateQuantity(orderProductQuantity);

    return order;
  }
}

export default CreateOrderService;
