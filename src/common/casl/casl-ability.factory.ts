import {
  AbilityBuilder,
  createMongoAbility,
  ExtractSubjectType,
  MongoAbility,
} from '@casl/ability';

export enum Action {
  Manage = 'manage',
  Create = 'create',
  Read = 'read',
  Update = 'update',
  Delete = 'delete',
  Like = 'like',
}

export type Subject =
  | 'Product'
  | 'Category'
  | 'Brand'
  | 'Cart'
  | 'Order'
  | 'Delivery'
  | 'Inventory'
  | 'User'
  | 'Image'
  | 'DiscountCode'
  | 'all';

export type AppAbility = MongoAbility<[Action, Subject]>;

export interface AuthUser {
  userId: string;
  role: string;
}

export class CaslAbilityFactory {
  createForUser(user: AuthUser): AppAbility {
    const { can, build } = new AbilityBuilder<AppAbility>(createMongoAbility);

    switch (user.role) {
      case 'manager':
        can(Action.Manage, 'Product');
        can(Action.Manage, 'Category');
        can(Action.Manage, 'Brand');
        can(Action.Manage, 'Inventory');
        can(Action.Read, 'Order');
        can(Action.Update, 'Order');
        can(Action.Manage, 'Delivery');
        can(Action.Manage, 'Image');
        can(Action.Manage, 'DiscountCode');
        break;

      case 'client':
        can(Action.Read, 'Product');
        can(Action.Like, 'Product');
        can(Action.Read, 'Category');
        can(Action.Read, 'Brand');
        can(Action.Manage, 'Cart');
        can(Action.Create, 'Order');
        can(Action.Read, 'Order');
        can(Action.Read, 'Delivery');
        break;

      case 'delivery_person':
        can(Action.Read, 'Delivery');
        can(Action.Update, 'Delivery');
        can(Action.Update, 'Order');
        can(Action.Read, 'Order');
        break;
    }

    return build({
      detectSubjectType: (item) =>
        item as unknown as ExtractSubjectType<Subject>,
    });
  }
}
