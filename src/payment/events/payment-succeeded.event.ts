export class PaymentSucceededEvent {
  orderId: string;
  addressId: string;
  products: { inventoryId: string; amount: number }[];
}
